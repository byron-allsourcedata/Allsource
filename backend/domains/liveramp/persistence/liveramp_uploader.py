import os
import logging
import paramiko
from typing import Dict, Any, Optional
from pathlib import Path
import re
import stat

logger = logging.getLogger(__name__)


class LiverampSftpUploader:
    def __init__(
        self,
        host: str = None,
        port: int = 22,
        username: str = None,
        password: str = None,
        private_key_path: str = None,
    ):
        self.host = host or os.getenv(
            "LIVERAMP_SFTP_HOST", "files.liveramp.com"
        )
        self.port = port or int(os.getenv("LIVERAMP_SFTP_PORT", "22"))
        self.username = username or os.getenv("LIVERAMP_SFTP_USERNAME")
        self.password = password or os.getenv("LIVERAMP_SFTP_PASSWORD")
        self.private_key_path = private_key_path or os.getenv(
            "LIVERAMP_SFTP_PRIVATE_KEY_PATH"
        )
        self.base_remote_directory = "/uploads"

        self.audience_subdirectory = os.getenv("LIVERAMP_SFTP_AUDIENCE_DIR", "")

        self._validate_config()

    def _validate_config(self):
        required_params = {
            "LIVERAMP_SFTP_USERNAME": self.username,
        }

        missing = [k for k, v in required_params.items() if not v]
        if missing:
            logger.error(f"Missing SFTP configuration: {missing}")
            raise ValueError(f"Missing SFTP configuration: {missing}")

        if not self.password and not self.private_key_path:
            logger.error("Either password or private key path must be provided")
            raise ValueError(
                "Either password or private key path must be provided"
            )

        logger.info(
            f"SFTP config validated: host={self.host}, user={self.username}, audience_dir={self.audience_subdirectory}"
        )

    def _create_ssh_client(self) -> paramiko.SSHClient:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            connect_params = {
                "hostname": self.host,
                "port": self.port,
                "username": self.username,
                "timeout": 30,
            }

            if self.private_key_path and os.path.exists(self.private_key_path):
                logger.info(
                    f"Using private key authentication: {self.private_key_path}"
                )
                private_key = paramiko.RSAKey.from_private_key_file(
                    self.private_key_path
                )
                connect_params["pkey"] = private_key
            elif self.password:
                logger.info("Using password authentication")
                connect_params["password"] = self.password
            else:
                raise ValueError("No authentication method provided")

            client.connect(**connect_params)
            logger.info(f"Successfully connected to LiveRamp SFTP: {self.host}")
            return client

        except Exception as e:
            logger.error(f"Failed to connect to LiveRamp SFTP: {e}")
            client.close()
            raise

    def _get_remote_directory(self) -> str:
        if self.audience_subdirectory:
            # Заменяем пробелы на подчеркивания согласно документации
            safe_audience_name = self.audience_subdirectory.replace(" ", "_")
            return f"{self.base_remote_directory}/{safe_audience_name}"
        else:
            return self.base_remote_directory

    def upload_file(
        self, local_file_path: str, remote_filename: str = None
    ) -> Dict[str, Any]:
        ssh_client = None
        sftp = None

        try:
            validation = self.validate_file(local_file_path)
            if not validation["valid"]:
                return {"success": False, "error": validation["error"]}

            ssh_client = self._create_ssh_client()
            sftp = ssh_client.open_sftp()

            remote_dir = self._get_remote_directory()
            self._ensure_remote_directory_exists(sftp, remote_dir)

            if not remote_filename:
                remote_filename = os.path.basename(local_file_path)

            remote_file_path = f"{remote_dir}/{remote_filename}"

            logger.info(
                f"Uploading {local_file_path} to LiveRamp SFTP: {remote_file_path}"
            )

            sftp.put(local_file_path, remote_file_path)

            file_stat = sftp.stat(remote_file_path)
            file_size = file_stat.st_size

            logger.info(
                f"Successfully uploaded file to LiveRamp SFTP: {remote_file_path} ({file_size} bytes)"
            )

            return {
                "success": True,
                "remote_path": remote_file_path,
                "file_size": file_size,
                "local_file": local_file_path,
                "timestamp": file_stat.st_mtime,
                "message": "File uploaded successfully. Check ingestion status in LiveRamp Connect within 20 minutes.",
            }

        except Exception as e:
            logger.error(f"Error uploading file to LiveRamp SFTP: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Upload failed. Please check SFTP credentials and network connectivity.",
            }
        finally:
            if sftp:
                sftp.close()
            if ssh_client:
                ssh_client.close()

    def _ensure_remote_directory_exists(self, sftp, remote_dir: str):
        try:
            sftp.stat(remote_dir)
            logger.debug(f"Remote directory exists: {remote_dir}")
        except FileNotFoundError:
            logger.info(f"Creating remote directory: {remote_dir}")
            self._create_remote_directory_recursive(sftp, remote_dir)

    def _create_remote_directory_recursive(self, sftp, remote_path: str):
        if remote_path == "/":
            return

        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            parent = os.path.dirname(remote_path)
            if parent and parent != "/":
                self._create_remote_directory_recursive(sftp, parent)
            try:
                sftp.mkdir(remote_path)
                logger.info(f"Created directory: {remote_path}")
            except Exception as e:
                logger.warning(f"Could not create directory {remote_path}: {e}")

    def list_uploaded_files(self) -> Dict[str, Any]:
        ssh_client = None
        sftp = None

        try:
            ssh_client = self._create_ssh_client()
            sftp = ssh_client.open_sftp()

            remote_dir = self._get_remote_directory()
            files = []

            for file_attr in sftp.listdir_attr(remote_dir):
                if stat.S_ISREG(file_attr.st_mode):
                    files.append(
                        {
                            "name": file_attr.filename,
                            "size": file_attr.st_size,
                            "modified": file_attr.st_mtime,
                            "path": f"{remote_dir}/{file_attr.filename}",
                        }
                    )

            return {
                "success": True,
                "files": files,
                "directory": remote_dir,
                "total_files": len(files),
            }

        except Exception as e:
            logger.error(f"Error listing files on LiveRamp SFTP: {e}")
            return {"success": False, "error": str(e)}
        finally:
            if sftp:
                sftp.close()
            if ssh_client:
                ssh_client.close()

    def validate_file(self, file_path: str) -> Dict[str, Any]:
        try:
            if not os.path.exists(file_path):
                return {"valid": False, "error": f"File not found: {file_path}"}

            file_size = os.path.getsize(file_path)
            file_name = os.path.basename(file_path)

            if not self._validate_filename(file_name):
                return {
                    "valid": False,
                    "error": f"Invalid filename according to LiveRamp requirements: {file_name}",
                }

            if file_size > 100 * 1024 * 1024 * 1024:  # 100GB
                return {
                    "valid": False,
                    "error": f"File too large: {file_size} bytes (LiveRamp daily limit is 1TB)",
                }

            if file_size == 0:
                return {"valid": False, "error": "File is empty"}

            # Проверяем что файл CSV
            if not file_name.lower().endswith(".csv"):
                return {"valid": False, "error": "File must be a CSV file"}

            return {
                "valid": True,
                "file_size": file_size,
                "file_name": file_name,
                "message": "File validation passed",
            }

        except Exception as e:
            return {"valid": False, "error": str(e)}

    def _validate_filename(self, filename: str) -> bool:
        if re.search(r"[!@#$%\[\]:{}?*\\\s]", filename):
            return False

        if filename.startswith((".", "_")):
            return False

        try:
            filename.encode("ascii")
        except UnicodeEncodeError:
            return False

        if len(filename) > 250:
            return False

        if not filename.lower().endswith(".csv"):
            return False

        return True

    def test_connection(self) -> Dict[str, Any]:
        ssh_client = None
        try:
            ssh_client = self._create_ssh_client()
            sftp = ssh_client.open_sftp()

            # Пробуем получить список файлов в uploads директории
            remote_dir = self._get_remote_directory()
            try:
                sftp.listdir(remote_dir)
            except FileNotFoundError:
                # Если директории нет, это нормально - создадим ее
                logger.info(
                    f"Remote directory {remote_dir} doesn't exist yet (this is normal)"
                )

            return {
                "success": True,
                "message": f"LiveRamp SFTP connection successful to {self.host}",
                "host": self.host,
                "username": self.username,
                "remote_directory": remote_dir,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to connect to LiveRamp SFTP. Check credentials and network.",
            }
        finally:
            if ssh_client:
                ssh_client.close()
