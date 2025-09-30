document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('user-list');
    const selectedUserEmail = document.getElementById('selected-user-email');
    const saveSignatureBtn = document.getElementById('save-signature');

    const API_BASE_URL = '/api'; // Use a relative path for the API
    let selectedUser = null;

    // Initialize TinyMCE
    tinymce.init({
        selector: '#editor',
        height: 300,
        menubar: false,
        plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
        ],
        toolbar: 'undo redo | formatselect | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
        setup: (editor) => {
            editor.on('init', () => {
                editor.setContent('<p>Select a user to load their signature.</p>');
                editor.setMode('readonly');
            });
        }
    });

    // Fetch all users from the backend
    async function fetchUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) {
                throw new Error('Failed to fetch users.');
            }
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Could not load users. Make sure the backend is running.');
        }
    }

    // Display users in the list
    function displayUsers(users) {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.primaryEmail} (${user.name.fullName})`;
            li.dataset.email = user.primaryEmail;
            li.addEventListener('click', () => selectUser(user));
            userList.appendChild(li);
        });
    }

    // Handle user selection
    async function selectUser(user) {
        if (selectedUser && selectedUser.primaryEmail === user.primaryEmail) return;

        selectedUser = user;
        selectedUserEmail.textContent = user.primaryEmail;

        // Highlight the selected user
        document.querySelectorAll('#user-list li').forEach(li => {
            li.classList.remove('selected');
            if (li.dataset.email === user.primaryEmail) {
                li.classList.add('selected');
            }
        });

        // Enable the editor and save button
        tinymce.activeEditor.setMode('design');
        saveSignatureBtn.disabled = false;

        // Fetch and display the user's signature
        await fetchSignature(user.primaryEmail);
    }

    // Fetch a user's signature
    async function fetchSignature(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${email}/signature`);
            if (!response.ok) {
                throw new Error('Failed to fetch signature.');
            }
            const data = await response.json();
            tinymce.activeEditor.setContent(data.signature || '<p>This user has no signature.</p>');
        } catch (error) {
            console.error(`Error fetching signature for ${email}:`, error);
            tinymce.activeEditor.setContent('<p>Could not load signature.</p>');
        }
    }

    // Save the signature
    saveSignatureBtn.addEventListener('click', async () => {
        if (!selectedUser) return;

        const newSignature = tinymce.activeEditor.getContent();
        try {
            const response = await fetch(`${API_BASE_URL}/users/${selectedUser.primaryEmail}/signature`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature: newSignature }),
            });

            if (!response.ok) {
                throw new Error('Failed to save signature.');
            }

            alert('Signature saved successfully!');
        } catch (error) {
            console.error('Error saving signature:', error);
            alert('Failed to save signature. See console for details.');
        }
    });

    // Initial load
    fetchUsers();
});