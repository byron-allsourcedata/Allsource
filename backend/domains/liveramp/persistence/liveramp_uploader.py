# import paramiko
# import os
# from typing import Optional
# from . import config
# from .exceptions import UploadError
#
#
# def upload_file(
#     local_path: str,
#     remote_subdir: Optional[str] = None,
#     host: str = config.SFTP.host,
#     port: int = config.SFTP.port,
#     username: str = config.SFTP.username,
#     password: str | None = config.SFTP.password,
#     pkey_path: str | None = config.SFTP.pkey_path,
#     remote_base: str = config.SFTP.remote_upload_dir,
# ):
#     transport = None
#     sftp = None
#     try:
#         transport = paramiko.Transport((host, port))
#         if pkey_path:
#             pkey = paramiko.RSAKey.from_private_key_file(pkey_path)
#             transport.connect(username=username, pkey=pkey)
#         else:
#             transport.connect(username=username, password=password)
#         sftp = paramiko.SFTPClient.from_transport(transport)
#
#         # ensure remote dir exists
#         remote_dir = remote_base
#         if remote_subdir:
#             # replace spaces with underscores as doc suggests
#             remote_dir = os.path.join(
#                 remote_base, remote_subdir.replace(" ", "_")
#             )
#             try:
#                 sftp.stat(remote_dir)
#             except IOError:
#                 sftp.mkdir(remote_dir)
#
#         remote_path = os.path.join(remote_dir, os.path.basename(local_path))
#         sftp.put(local_path, remote_path)
#         return remote_path
#     except Exception as e:
#         raise UploadError(f"SFTP upload failed: {e}")
#     finally:
#         if sftp:
#             sftp.close()
#         if transport:
#             transport.close()
