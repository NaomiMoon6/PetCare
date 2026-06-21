function applyTheme(theme) {

    const isDark =
    theme === "dark";

    document.documentElement.classList.toggle(
        "dark",
        isDark
    );

    localStorage.setItem(
        "theme",
        theme
    );

    if(window.updateMapTheme){
        window.updateMapTheme(isDark);
    }

}


function toggleTheme() {

    const currentTheme =
    document.documentElement.classList.contains(
        "dark"
    )
    ? "light"
    : "dark";

    applyTheme(
        currentTheme
    );

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedTheme =
        localStorage.getItem("theme") ||
        "light";

        applyTheme(
            savedTheme
        );

        const toggleButton =
        document.getElementById(
            "toggle", "toggle2"
        );

        if(toggleButton){

            toggleButton.addEventListener(
                "click",
                toggleTheme
            );

        }

        const toggleButton2 =
        document.getElementById(
            "toggle2"
        );

        if(toggleButton2){

            toggleButton2.addEventListener(
                "click",
                toggleTheme
            );

        }

    }
);