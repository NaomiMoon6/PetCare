document.getElementById("settings")
.addEventListener(
    "click",
    async () => {
        const popupShadow = document.getElementById("popup-shadow");
        const popup = document.getElementById("popup");
            
        popup.classList.remove("hidden")
        popupShadow.classList.remove("hidden")
        document.body.classList.add("no-scroll")
    }
);

document.getElementById("closePopup")
.addEventListener(
    "click",
    async () => {
        const popupShadow = document.getElementById("popup-shadow");
        const popup = document.getElementById("popup");
            
        popup.classList.add("hidden")
        popupShadow.classList.add("hidden")
        document.body.classList.remove("no-scroll")
    }
);

document.getElementById("deleteALL")
.addEventListener(
    "click",
    async () => {
        const confirmed =
        confirm(
            "Tem certeza que deseja excluir TODOS os pets? \n\n Essa ação não pode ser disfeita."
        );

        if(!confirmed){
            return;
        }

        try {

            const result =
            await petAPI.delALLPet();


            if(result && result.success && result.changes > 0){

                alert("Todos os pets foram removidos com sucesso!");

                localStorage.removeItem("selectedPet");

                window.location.reload();

                return;

            }
            else {
                alert("Nenhum pet foi removido.");
            }

        }
        catch(error){

            console.error(error);

            alert(
                "Erro ao remover o pet."
            );

        }

        const popupShadow = document.getElementById("popup-shadow");
        const popup = document.getElementById("popup");
            
        popup.classList.add("hidden")
        popupShadow.classList.add("hidden")
        document.body.classList.remove("no-scroll")
    }
);

document.getElementById("settings")
.addEventListener(
    "click",
    async () => {
        const popupShadow = document.getElementById("popup-shadow");
        const popup = document.getElementById("popup");
            
        popup.classList.remove("hidden")
        popupShadow.classList.remove("hidden")
    }
);

function createMessageCard(message) {

    const card =
    document.createElement("div");

    card.className =
    "card";


    const text =
    document.createElement("p");

    text.className =
    "card-text";

    text.textContent =
    message;


    card.appendChild(text);

    return card;

}

const reminderRefreshers = [];

function createPetCard(pet) {
    const card = document.createElement("div");

    card.className =
    "card";

    card.addEventListener("click", () => {

        localStorage.setItem(
            "selectedPet",
            pet.id
        );

        window.location.href = "pet.html";

    });

    if(pet.photo){

        const image =
        document.createElement("img");

        image.className =
        "card-image";

        image.src =
        "../" + pet.photo;

        image.alt =
        pet.name;

        card.appendChild(image);

    }


    const title =
    document.createElement("h2");

    title.className =
    "card-title";

    title.textContent =
    pet.name;


    const details =
    document.createElement("p");

    details.className =
    "card-subtitle";

    details.textContent =
    `${pet.type || "Pet"} - ${pet.birth_date || "sem data"}`;


    const nextReminder =
    document.createElement("p");

    nextReminder.className =
    "card-text";

    nextReminder.textContent =
    "Próximo Lembrete: Carregando...";


    const nextVaccine =
    document.createElement("p");

    nextVaccine.className =
    "card-text";

    nextVaccine.textContent =
    "Próxima Vacina: Carregando...";


    card.appendChild(title);
    card.appendChild(details);
    card.appendChild(nextReminder);
    card.appendChild(nextVaccine);


    reminderRefreshers.push({ pet_id: pet.id, nextReminder, nextVaccine });

    loadNextReminder(pet.id, nextReminder);
    loadNextVaccine(pet.id, nextVaccine);

    return card;
}

function refreshNextOccurrences() {
    reminderRefreshers.forEach(({ pet_id, nextReminder, nextVaccine }) => {
        loadNextReminder(pet_id, nextReminder);
        loadNextVaccine(pet_id, nextVaccine);
    });
}

setInterval(refreshNextOccurrences, 60000);

function formatDateTime(value) {

    if(!value){
        return "";
    }

    return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}

async function loadNextReminder(pet_id, element) {

    try{

        const result = await petAPI.getReminders(pet_id);

        if(!result || !result.ok){
            element.innerHTML = `<b class="bold">Próximo Lembrete:</b> <br>  Nenhum cadastrado`;
            return;
        }

        const now = Date.now();

        const upcoming = result.reminders
            .filter((r) => r.last_reminder && new Date(r.last_reminder).getTime() > now)
            .sort((a, b) => new Date(a.last_reminder) - new Date(b.last_reminder));

        if(upcoming.length === 0){
            element.innerHTML = `<b class="bold">Próximo Lembrete:</b> <br>  Nenhum cadastrado`;
            return;
        }

        const next = upcoming[0];

        element.innerHTML =
        `<b class="bold">Próximo Lembrete:</b> <br> ${next.title}: ${formatDateTime(next.last_reminder)}`;

    }
    catch(error){
        console.error(error);
        element.innerHTML = `<b class="bold">Próximo Lembrete:</b> <br> erro ao carregar`;
    }

}

async function loadNextVaccine(pet_id, element) {

    try{

        const result = await petAPI.getVaccines(pet_id);

        if(!result || !result.ok){
            element.innerHTML = `<b class="bold">Próxima Vacina:</b> <br>  Nenhuma pendente`;
            return;
        }

        const now = Date.now();

        const upcoming = result.vaccines
            .filter((v) => v.next_dose && new Date(v.next_dose).getTime() > now)
            .sort((a, b) => new Date(a.next_dose) - new Date(b.next_dose));

        if(upcoming.length === 0){
            element.innerHTML = `<b class="bold">Próxima Vacina:</b> <br>  Nenhuma pendente`;
            return;
        }

        const next = upcoming[0];

        element.innerHTML =
        `<b class="bold">Próxima Vacina:</b> <br> ${next.name}: ${formatDateTime(next.next_dose)}`;

    }
    catch(error){
        console.error(error);
        element.innerHTML = `<b class="bold">Próxima Vacina:</b> <br>  Erro ao carregar`;
    }

}

async function loadPets() {

    const container =
    document.getElementById("pets-container");


    if(!container){
        return;
    }
    
    reminderRefreshers.length = 0;

    container.innerHTML =
    "";

    container.style.display =
    "contents";


    if(!window.petAPI){

        container.appendChild(
            createMessageCard("Abra o app pelo Electron para carregar os pets.")
        );

        return;

    }


    try{

        const result =
        await petAPI.getPets();


        if(!result || !result.ok){

            container.appendChild(
                createMessageCard(
                    "Nao foi possivel carregar os pets: " +
                    (result && result.error ? result.error : "erro desconhecido")
                )
            );

            return;

        }


        if(result.pets.length === 0){

            return;

        }


        result.pets.forEach((pet)=>{

            container.appendChild(
                createPetCard(pet)
            );

        });

    }
    catch(error){

        container.appendChild(
            createMessageCard(
                "Nao foi possivel carregar os pets: " +
                error.message
            )
        );

    }

}


window.addEventListener(
    "DOMContentLoaded",
    loadPets
);
