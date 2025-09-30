import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to your service account credentials
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')

# The email of the user to impersonate.
# This should be a super administrator in your Google Workspace.
# It's recommended to set this as an environment variable for production.
ADMIN_USER_EMAIL = os.environ.get('ADMIN_USER_EMAIL', 'dyolovsky@solitex.biz')

# Scopes required for the Admin SDK and Gmail API
SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/gmail.settings.basic'
]

def get_credentials():
    """Creates credentials from a service account file."""
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    # Impersonate the admin user to gain domain-wide access
    return creds.with_subject(ADMIN_USER_EMAIL)

@app.route('/api/users', methods=['GET'])
def list_users():
    """Lists the first 100 users in the domain."""
    try:
        creds = get_credentials()
        service = build('admin', 'directory_v1', credentials=creds)

        # Call the Admin SDK Directory API
        results = service.users().list(
            customer='my_customer',
            maxResults=100,  # Adjust as needed
            orderBy='email'
        ).execute()

        users = results.get('users', [])
        return jsonify(users)

    except HttpError as error:
        print(f"An error occurred: {error}")
        return jsonify({"error": str(error)}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/api/users/<user_email>/signature', methods=['GET', 'POST'])
def manage_signature(user_email):
    """Gets or updates the Gmail signature for a specific user."""
    creds = get_credentials()
    # We need to impersonate the user to access their Gmail settings
    user_creds = creds.with_subject(user_email)
    service = build('gmail', 'v1', credentials=user_creds)

    try:
        # Get the primary send-as alias email address
        send_as_list = service.users().settings().sendAs().list(userId='me').execute()
        primary_alias = next((alias for alias in send_as_list.get('sendAs', []) if alias.get('isPrimary')), None)

        if not primary_alias:
            return jsonify({"error": "Primary send-as alias not found."}), 404

        primary_alias_email = primary_alias.get('sendAsEmail')

        if request.method == 'GET':
            signature = primary_alias.get('signature', '')
            return jsonify({"signature": signature})

        if request.method == 'POST':
            data = request.get_json()
            new_signature = data.get('signature', '')

            # The body for the update request
            update_body = {
                'signature': new_signature
            }

            # Update the signature for the primary alias
            service.users().settings().sendAs().patch(
                userId='me',
                sendAsEmail=primary_alias_email,
                body=update_body
            ).execute()

            return jsonify({"message": "Signature updated successfully."})

    except HttpError as error:
        print(f"An error occurred: {error}")
        return jsonify({"error": str(error)}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

# The application is now intended to be run with a production WSGI server like Gunicorn.
# Example command: gunicorn --bind 0.0.0.0:5000 app:app