
let password = document.getElementById("password");
let confirmPassword = document.getElementById("confirm-password");

if (password && confirmPassword) {
    confirmPassword.addEventListener("input", function () {
        if (confirmPassword.value !== password.value) {
            confirmPassword.setCustomValidity("A jelszavak nem egyeznek meg.");
        } else {
            confirmPassword.setCustomValidity("");
        }
    });
}

