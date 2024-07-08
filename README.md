# MAXIMIZ


## Downloads

To get started with the project, you will need to install several dependencies.

1. **Creating a virtual environment (optional):**

   It is recommended to create a virtual environment before installing dependencies:

   ```bash
   python -m venv venv
   source venv/bin/activate  # For Unix/MacOS
   venv\Scripts\activate  # For Windows
   ```
2. **Setting PYTHONPATH:**

   ```bash
   export PYTHONPATH=/path/to/project/maximiz/
   ```
3. **Running the Project:**
   
   ```bash
   cd maximiz/backend/
   uvicorn main/:app --uds ../dev_backend.sock
   ```
   