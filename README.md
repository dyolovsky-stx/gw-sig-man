# Gmail Signature Manager for Google Workspace

This web application allows Google Workspace administrators to manage the Gmail signatures of users within their domain. It provides a simple interface to list all users, view their current signatures, and update them using a rich text editor.

## Features

- **List Google Workspace Users**: Fetches and displays a list of all users in your domain.
- **Rich Text Signature Editor**: Uses TinyMCE to provide a WYSIWYG editor for creating and editing HTML signatures.
- **Centralized Management**: Allows administrators to manage all user signatures from a single dashboard.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Google Workspace Account**: You must be a Google Workspace administrator.
2.  **Google Cloud Project**: A project with the Admin SDK and Gmail API enabled.
3.  **Service Account**: You need to create a service account and grant it domain-wide delegation.

### Setting Up the Service Account and APIs

1.  **Create a Google Cloud Project**:
    - Go to the [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project.

2.  **Enable APIs**:
    - In your project, navigate to **APIs & Services > Library**.
    - Search for and enable the **Admin SDK API** and the **Gmail API**.

3.  **Create a Service Account**:
    - Go to **APIs & Services > Credentials**.
    - Click **Create Credentials > Service account**.
    - Give it a name and click **Create and Continue**.
    - Grant it the **Service Account User** role.
    - Click **Done**.

4.  **Create Service Account Key**:
    - After creating the service account, click on it to manage its keys.
    - Go to the **Keys** tab, click **Add Key > Create new key**.
    - Select **JSON** as the key type and click **Create**.
    - A `credentials.json` file will be downloaded.

5.  **Configure Domain-Wide Delegation**:
    - Go to your [Google Workspace Admin console](https://admin.google.com/).
    - Navigate to **Security > Access and data control > API controls**.
    - Under **Domain-wide Delegation**, click **Manage Domain-wide Delegation**.
    - Click **Add new** and enter the **Client ID** of your service account (you can find this in the `credentials.json` file).
    - In the **OAuth scopes** field, add the following scopes:
      ```
      https://www.googleapis.com/auth/admin.directory.user.readonly,
      https://www.googleapis.com/auth/gmail.settings.basic
      ```
    - Click **Authorize**.

## How to Run the Application Locally

### Backend Setup

1.  **Place Credentials**:
    - Move the downloaded `credentials.json` file into the `backend/` directory.

2.  **Update Admin User Email**:
    - Open `backend/app.py`.
    - Change the `ADMIN_USER_EMAIL` variable to the email address of a super administrator in your Google Workspace.

3.  **Install Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Run the Backend Server with Gunicorn**:
    ```bash
    gunicorn --chdir backend --bind 0.0.0.0:5000 app:app
    ```
    The backend will be running at `http://localhost:5000`.

### Frontend Setup

1.  **Serve the Frontend**:
    - You need to serve the `frontend/` directory with a simple HTTP server. If you have Python installed, you can use:
    ```bash
    # From the root directory of the project
    python -m http.server 8000 --directory frontend
    ```

2.  **Access the Application**:
    - Open your web browser and go to `http://localhost:8000`.

You should now see the Gmail Signature Manager, with a list of your Google Workspace users. You can select a user to view and edit their signature.

## Deployment

This application is configured for deployment on platforms that support Python buildpacks and `Procfile`, such as Heroku.

1.  **Create a new application** on your hosting platform of choice.
2.  **Set up environment variables**:
    - You will need to provide the contents of your `credentials.json` file as an environment variable. A common approach is to base64 encode the JSON file and then decode it in your application at runtime.
    - You will also need to set the `ADMIN_USER_EMAIL` as an environment variable.
    - The code would need to be modified to read these from the environment instead of a file.
3.  **Push your code** to the platform's Git remote. The platform will detect the `requirements.txt` and `Procfile`, install dependencies, and start the web server.

**Note**: For a production deployment, you would also need to build and serve the frontend files from the same web server as the backend (e.g., using a library like `WhiteNoise`) or host the frontend on a static hosting service and configure CORS settings appropriately.