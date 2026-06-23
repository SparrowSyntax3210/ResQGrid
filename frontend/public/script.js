const loginBtn = document.querySelector(".login");
const RegBtn = document.querySelector(".register");
const Listing = document.querySelector(".listing");

Listing.addEventListener("click" , ()=> {
    window.location.href = "listing.html";
})

RegBtn.addEventListener("click" , (req,res)=> {
    window.location.href = "register.html";
})

async function checkAuthStatus() {
    try {
        const response = await fetch("/auth/status", {
            method: "GET",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (data.loggedIn) {
            loginBtn.textContent = "Sign Out";

            loginBtn.onclick = async (e) => {
                e.preventDefault();

                try {
                    const logoutResponse = await fetch("/auth/logout", {
                        method: "POST",
                        credentials: "same-origin"
                    });

                    if (logoutResponse.ok) {
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Logout Error:", error);
                }
            };

        } else {
            loginBtn.textContent = "Login";

            loginBtn.onclick = () => {
                window.location.href = "/login.html";
            };
        }

    } catch (error) {
        console.error("Auth Status Error:", error);

        loginBtn.textContent = "Login";

        loginBtn.onclick = () => {
            window.location.href = "/login.html";
        };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (loginBtn) {
        checkAuthStatus();
    }
});