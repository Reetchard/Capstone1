const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};


 
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Firebase references
const auth = firebase.auth();
const database = firebase.database();
const accountRef = database.ref('Accounts');
// Function to display all accounts
      function displayAccountInfo() {
                accountRef.once('value', function(snapshot) {
                    const accounts = snapshot.val();
                    const accountInfoBody = document.getElementById('accountInfoBody');
                    accountInfoBody.innerHTML = '';
            
                    if (accounts) {
                        for (const key in accounts) {
                            if (accounts.hasOwnProperty(key)) {
                                const account = accounts[key];
                                const roleId = account.roleId || 'N/A';
                                const status = account.status || 'N/A';
                                const isAdmin = roleId === 'admin'; // Adjust this condition based on your roleId for Admin
            
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td><input type="checkbox" class="selectAccount" value="${key}" ${isAdmin ? 'disabled' : ''}></td>
                                    <td>${roleId}</td>
                                    <td><a href="#" onclick="viewAccountDetails('${key}'); return false;">${account.username || 'N/A'}</a></td>
                                    <td>${status}</td>
                                    <td>
                                        <button class="btn btn-info btn-sm" onclick="setStatus('${key}', 'Still under review')">Review</button>
                                        <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                                        <button class="btn btn-danger btn-sm" onclick="blockAccount('${key}')">Block</button>
                                    </td>
                                `;
            
                                accountInfoBody.appendChild(row);
                            }
                        }
                    } else {
                        accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found.</td></tr>';
                    }
                }).catch(error => {
                    console.error('Error fetching data:', error);
                    showToast('Error', 'Error fetching account data. Please try again later.');
                });
            }     
 // Function to get the next ID
    function getNextId(callback) {
        accountRef.once('value', function(snapshot) {
            const accounts = snapshot.val();
            let maxId = 0;
    
            if (accounts) {
                for (const key in accounts) {
                    if (accounts.hasOwnProperty(key)) {
                        const account = accounts[key];
                        const accountId = parseInt(account.id, 10);
                        if (!isNaN(accountId) && accountId > maxId) {
                            maxId = accountId;
                        }
                    }
                }
            }
    
            callback(maxId + 1);
        }).catch(error => {
            console.error('Error fetching data for ID:', error);
            showToast('Error', 'Unable to determine next ID. Defaulting to 1.');
            callback(1);
        });
    }
// Function to add or edit account
document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const key = document.getElementById('accountKey').value;

    if (username && email) {
        getNextId(function(nextId) {
            const accountData = {
                roleId: nextId,
                username,
                email,
                status: 'Active',
                online: true,
                lastOnline: new Date().toISOString()
            };

            if (key) {
                accountRef.child(key).update(accountData).then(() => {
                    $('#accountModal').modal('hide');
                    displayAccountInfo();
                    showToast('Success', 'Account updated successfully.');
                }).catch(error => {
                    console.error('Error updating account:', error);
                    showToast('Error', 'Error updating account. Please try again later.');
                });
            } else {
                accountRef.push(accountData).then(() => {
                    $('#accountModal').modal('hide');
                    displayAccountInfo();
                    showToast('Success', 'Account added successfully.');
                }).catch(error => {
                    console.error('Error adding account:', error);
                    showToast('Error', 'Error adding account. Please try again later.');
                });
            }
        });
    } else {
        showToast('Error', 'Please fill in all required fields.');
    }
});
// Function to edit account
window.editAccount = function(key) {
    accountRef.child(key).once('value', function(snapshot) {
        const account = snapshot.val();
        const roleId = account.roleId;

        // Check if the account is admin
        if (roleId === 'admin') { // Adjust this condition based on your roleId for Admin
            showToast('Warning', 'Cannot edit Admin account.');
            return;
        }

        document.getElementById('username').value = account.username;
        document.getElementById('email').value = account.email;
        document.getElementById('accountKey').value = key;
        $('#accountModal').modal('show');
    }).catch(error => {
        console.error('Error fetching account data:', error);
        showToast('Error', 'Error fetching account data. Please try again later.');
    });
};
// Function to set the status of an account
window.setStatus = function(key, status) {
    accountRef.child(key).update({ status: status }).then(() => {
        displayAccountInfo();
        handleSuccess(`${status} successfully.`);
    }).catch(error => {
        console.error(`Error updating account status: ${error}`);
        handleError('There was an issue updating the account status. Please try again or contact support if the problem persists.');
    });
};

// Function to delete selected accounts
window.deleteSelected = function() {
    const selectedCheckboxes = document.querySelectorAll('.selectAccount:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('Warning', 'Please select at least one account to delete.');
        return;
    }

    if (confirm('Are you sure you want to delete the selected accounts?')) {
        selectedCheckboxes.forEach(checkbox => {
            const key = checkbox.value;
            accountRef.child(key).remove().catch(error => {
                console.error('Error deleting account:', error);
                showToast('Error', 'Error deleting selected accounts. Please try again later.');
            });
        });

        displayAccountInfo();
        showToast('Success', 'Selected accounts deleted successfully.');
    }
};
// Function to toggle all checkboxes
window.toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.selectAccount');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
};
// Display account information on page load
displayAccountInfo();
// Function to search accounts by ID
function searchAccount() {
    const searchId = document.getElementById('searchAccountId').value.trim();
    accountRef.once('value', function(snapshot) {
        const accounts = snapshot.val();
        const accountInfoBody = document.getElementById('accountInfoBody');
        accountInfoBody.innerHTML = '';

        if (accounts) {
            let found = false;
            for (const key in accounts) {
                if (accounts.hasOwnProperty(key)) {
                    const account = accounts[key];
                    if (account.roleId.toString().includes(searchId)) {
                        const row = document.createElement('tr');
                        const status = account.status || 'N/A';
                        row.innerHTML = `
                            <td><input type="checkbox" class="selectAccount" value="${key}"></td>
                            <td>${account.roleId || 'N/A'}</td>
                            <td><a href="#" onclick="viewAccountDetails('${key}'); return false;">${account.username || 'N/A'}</a></td>
                            <td>${status}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick="setStatus('${key}', 'Idle')">Idle</button>
                                <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                                <button class="btn btn-danger btn-sm" onclick="removeAccount('${key}')">Remove</button>
                            </td>
                        `;
                        accountInfoBody.appendChild(row);
                        found = true;
                    }
                }
            }

            if (!found) {
                accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found with this ID.</td></tr>';
            }
        } else {
            accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found.</td></tr>';
        }
    }).catch(error => {
        console.error('Error fetching data:', error);
        showToast('Error', 'Error fetching account data. Please try again later.');
    });
}
window.blockAccount = function(key) {
    if (confirm('Are you sure you want to block this account?')) {
        accountRef.child(key).update({ status: 'Blocked' }).then(() => {
            displayAccountInfo();
            handleNotification('success', 'The account has been successfully blocked.');
        }).catch(error => {
            console.error('Error blocking account:', error);
            handleNotification('error', 'We encountered an issue blocking the account. Please try again later.');
        });
    }       
};

 
 function loadAccounts() {
        const accountInfoBody = document.getElementById('accountInfoBody');
        accountInfoBody.innerHTML = ''; // Clear existing content
    
        database.ref('accounts').once('value').then(snapshot => {
            snapshot.forEach(childSnapshot => {
                const account = childSnapshot.val();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="table-checkbox" value="${childSnapshot.key}"></td>
                    <td>${account.id}</td>
                    <td><a href="#" onclick="viewAccountDetails('${childSnapshot.key}')">${account.username}</a></td>
                    <td>${account.status}</td>
                    <td><button class="btn btn-warning" onclick="viewAccountDetails('${childSnapshot.key}')">View Details</button></td>
                `;
                accountInfoBody.appendChild(row);
            });
        });
    }
    // Function to view detailed account information
    function viewAccountDetails(key) {
        accountRef.child(key).once('value', function(snapshot) {
            const account = snapshot.val();
    
            if (account) {
                // Populate the modal with account details
                document.getElementById('username').value = account.username || 'N/A';
                document.getElementById('email').value = account.email || 'N/A';
                document.getElementById('status').value = account.status || 'N/A';
                document.getElementById('role').value = account.role || 'N/A';
    
                // Show special fields based on role (Gym Owner, Trainer, etc.)
                const specialFieldGroup = document.getElementById('specialFieldGroup');
                specialFieldGroup.innerHTML = '';
    
                if (account.role === 'Gym Owner') {
                    specialFieldGroup.innerHTML = `
                        <div class="form-group">
                            <label for="gymName">Gym Name</label>
                            <input type="text" name="gymName" class="form-control" id="gymName" value="${account.gymName || 'N/A'}" readonly>
                        </div>
                    `;
                } else if (account.role === 'Trainer') {
                    specialFieldGroup.innerHTML = `
                        <div class="form-group">
                            <label for="certifications">Certifications</label>
                            <input type="text" name="certifications" class="form-control" id="certifications" value="${account.certifications || 'N/A'}" readonly>
                        </div>
                    `;
                }
    
                $('#accountModal').modal('show');
            } else {
                showToast('Error', 'Account not found.');
            }
        }).catch(error => {
            console.error('Error fetching account data:', error);
            showToast('Error', 'Error fetching account data. Please try again later.');
        });
    }
    
    // Function to approve account (optional, adjust as needed)
    function approveAccount() {
        const key = document.getElementById('accountKey').value;
        accountRef.child(key).update({ status: 'Approved' }).then(() => {
            $('#accountModal').modal('hide');
            displayAccountInfo();
            showToast('Success', 'Account approved successfully.');
        }).catch(error => {
            console.error('Error approving account:', error);
            showToast('Error', 'Error approving account. Please try again later.');
        });
    }
    
function showNotification(type, message) {
    const notificationContainer = document.getElementById('notification-container');
    const notificationMessage = document.getElementById('notification-message');
    const notificationText = document.getElementById('notification-text');
    
    // Remove any existing classes
    notificationMessage.classList.remove('success', 'info', 'warning', 'error');
    
    // Set the type and message
    notificationMessage.classList.add(type);
    notificationText.textContent = message;
    
    // Show the notification
    notificationMessage.style.display = 'block';
    
    // Hide the notification after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notificationMessage = document.getElementById('notification-message');
    notificationMessage.style.display = 'none';
}

function handleSuccess(message) {
    showNotification('success', message);
}

function handleError(message) {
    showNotification('error', message);
}
