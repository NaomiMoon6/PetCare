document.getElementById("delete")
.addEventListener(
    "click",
    async () => {

        if(isEditingPet){
            cancelPetEdit();
            return;
        }

        const confirmed =
        confirm(
            "Tem certeza que deseja excluir este pet?"
        );

        if(!confirmed){
            return;
        }

        const id =
        localStorage.getItem(
            "selectedPet"
        );

        try {

            const result =
            await petAPI.delPet(id);


            if(
                result &&
                result.success &&
                result.changes > 0
            ){

                alert(
                    "Pet removido com sucesso!"
                );

                localStorage.removeItem(
                    "selectedPet"
                );

                window.location.href =
                "index.html";

            }
            else {

                alert(
                    "Nenhum pet foi removido."
                );

            }

        }
        catch(error){

            console.error(error);

            alert(
                "Erro ao remover o pet."
            );

        }

    }
);

const previewBox = document.querySelector(".big-image");

function setPreviewImage(imagePath) {

    if(!previewBox){
        return;
    }

    previewBox.style.backgroundImage =
        imagePath
        ? `url("../${imagePath}")`
        : "";

}

let currentPet = null;

const defaultPetPhotos = {
    gato: "assets/default-cat.svg",
    cachorro: "assets/default-dog.svg",
    coelho: "assets/default-bunny.svg",
    roedor: "assets/default-hamster.svg",
    ave: "assets/default-bird.svg",
    reptil: "assets/default-lizard.svg",
    outro: "assets/default-other.svg"
};

function normalizeSpecies(value) {

    return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}

async function loadPet() {

    const id = localStorage.getItem("selectedPet");

    if(!id){

        const container =
        document.getElementById("pet-container");

        if(container){
            container.textContent =
            "Nenhum pet selecionado";
        }

        return;

    }


    try {

        const pet =
        await petAPI.getPet(id);

        console.log("Loaded pet:", pet);


        if(!pet){
            return;
        }


        setPreviewImage(pet.photo);


        const container =
        document.getElementById("pet-container");

                currentPet = pet;

        container.innerHTML = `

        <div class="tag-shadow">
            <div class="tag"> 
                <h2 class="tag-text">
                    ${pet.name}
                </h2>
                <input class="edit-info hidden" type="text" id="editName" value="${pet.name || ""}">
            </div>
            
        </div>

        <div class="box">
        <div class="bg">
            <h3 class="item-title"> Espécie: <h3>
            <p class="item-text">
                ${pet.type}
            </p>
            <select class="edit-info hidden" id="editType">
                <option value="Gato" ${pet.type === "Gato" ? "selected" : ""}>Gato</option>
                <option value="Cachorro" ${pet.type === "Cachorro" ? "selected" : ""}>Cachorro</option>
                <option value="Coelho" ${pet.type === "Coelho" ? "selected" : ""}>Coelho</option>
                <option value="Roedor" ${pet.type === "Roedor" ? "selected" : ""}>Roedor</option>
                <option value="Ave" ${pet.type === "Ave" ? "selected" : ""}>Ave</option>
                <option value="Reptil" ${pet.type === "Reptil" ? "selected" : ""}>Réptil</option>
                <option value="Outro" ${pet.type === "Outro" ? "selected" : ""}>Outro</option>
            </select>

            <h3 class="item-title"> Data de Nascimento: <h3>
            <p class="item-text">
                ${pet.birth_date}
            </p>
            <input class="edit-info hidden" type="date" id="editBirthDate" value="${pet.birth_date || ""}">

            <h3 class="item-title"> Sexo: <h3>
            <p class="item-text">
                ${pet.sex}
            </p>
            <select class="edit-info hidden" id="editSex">
                <option value="Feminino" ${pet.sex === "Feminino" ? "selected" : ""}>Feminino</option>
                <option value="Masculino" ${pet.sex === "Masculono" ? "selected" : ""}>Masculino</option>
                <option value="Outro" ${pet.sex === "Outro" ? "selected" : ""}>Outro</option>
            </select>
        </div>
        </div>

        `;

    }
    catch(error){

        console.error(error);

    }

}

window.addEventListener(
    "DOMContentLoaded",
    loadPet
);

const editButton = document.getElementById("edit");
const deleteButton = document.getElementById("delete");
const photoInput = document.getElementById("file-upload");

let isEditingPet = false;
let selectedEditFile = null;
let selectedEditPreviewUrl = null;

function setPetViewMode(editing) {

    const labels = document.querySelectorAll(".tag-text, .item-text");
    const fields = document.querySelectorAll(".edit-info");

    labels.forEach(label => label.classList.toggle("hidden", editing));
    fields.forEach(field => field.classList.toggle("hidden", !editing));

    photoInput.classList.toggle("hidden", !editing);

    editButton.textContent = editing ? "Salvar Dados" : "Editar Dados";
    deleteButton.textContent = editing ? "Cancelar" : "Excluir Pet";

    isEditingPet = editing;

}

function cancelPetEdit() {

    if(selectedEditPreviewUrl){
        URL.revokeObjectURL(selectedEditPreviewUrl);
        selectedEditPreviewUrl = null;
    }

    selectedEditFile = null;
    photoInput.value = "";

    if(currentPet){

        setPreviewImage(currentPet.photo);

        document.getElementById("editName").value = currentPet.name || "";
        document.getElementById("editType").value = currentPet.type || "";
        document.getElementById("editSex").value = currentPet.sex || "";
        document.getElementById("editBirthDate").value = currentPet.birth_date || "";

    }

    setPetViewMode(false);

}

photoInput.addEventListener("change", () => {

    if(!isEditingPet){
        return;
    }

    if(selectedEditPreviewUrl){
        URL.revokeObjectURL(selectedEditPreviewUrl);
        selectedEditPreviewUrl = null;
    }

    const file =
    photoInput.files.length > 0
    ? photoInput.files[0]
    : null;

    selectedEditFile = file;

    if(file){
        selectedEditPreviewUrl = URL.createObjectURL(file);
        previewBox.style.backgroundImage = `url("${selectedEditPreviewUrl}")`;
    }

});

document.getElementById("pet-container")
.addEventListener("change", (event) => {

    if(event.target.id !== "editType" || !isEditingPet){
        return;
    }

    if(selectedEditFile){
        return; // a custom photo was already picked this session, leave it alone
    }

    const hasCustomPhoto =
    currentPet &&
    currentPet.photo &&
    !currentPet.photo.startsWith("assets/default-");

    if(hasCustomPhoto){
        return; // pet already has a real uploaded photo, species shouldn't override it
    }

    const species = normalizeSpecies(event.target.value);

    setPreviewImage(
        defaultPetPhotos[species] || defaultPetPhotos.outro
    );

});

editButton.addEventListener("click", async () => {

    if(!isEditingPet){
        setPetViewMode(true);
        return;
    }

    const id = localStorage.getItem("selectedPet");

    const imagePath =
    selectedEditFile && window.petAPI && petAPI.getFilePath
    ? petAPI.getFilePath(selectedEditFile)
    : null;

    const updatedPet = {
        id,
        name: document.getElementById("editName").value.trim(),
        type: document.getElementById("editType").value,
        sex: document.getElementById("editSex").value,
        birth_date: document.getElementById("editBirthDate").value,
        photo: currentPet ? currentPet.photo : null,
        imagePath,
        imageName: selectedEditFile ? selectedEditFile.name : null
    };

    try{

        const result =
        await petAPI.updatePet(updatedPet);

        if(result && result.ok){

            alert("Dados atualizados com sucesso!");
            selectedEditFile = null;
            await loadPet();
            setPetViewMode(false);

        }
        else{

            alert(
                "Nao foi possivel salvar as alteracoes: " +
                (result && result.error ? result.error : "erro desconhecido")
            );

        }

    }
    catch(error){

        console.error(error);
        alert("Erro ao salvar os dados do pet.");

    }

});

const popupShadow = document.getElementById("popup-shadow");
const popup = document.getElementById("popup");
const open = document.getElementById("openPopup");
const close = document.getElementById("closePopup");
const popupTitle = document.getElementById("popupTitle");
const popupSubmitLabel = document.getElementById("popupSubmitLabel");

const repeats = document.querySelectorAll(".repeat");
const checkbox = document.getElementById("myCheckbox");
const box = document.getElementById("popup");
const form = document.getElementById("reminderForm");

let editingReminderId = null; // null = adding a new reminder, otherwise the id being edited

function setRepeatFieldsVisible(visible) {
  repeats.forEach(item => item.classList.toggle("hidden", !visible));
  box.style.height = visible ? "600px" : "550px";
}

function setPopupMode(mode) {
  if(mode === "edit"){
    popupTitle.textContent = "Editar Lembrete";
    popupSubmitLabel.textContent = "Salvar Alterações";
  }
  else{
    popupTitle.textContent = "Novo Lembrete";
    popupSubmitLabel.textContent = "Adicionar Lembrete";
  }
}

function toDatetimeLocalValue(isoString) {

  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    date.getFullYear() + "-" +
    pad(date.getMonth() + 1) + "-" +
    pad(date.getDate()) + "T" +
    pad(date.getHours()) + ":" +
    pad(date.getMinutes())
  );

}

open.addEventListener("click", () => {
  editingReminderId = null;
  form.reset();
  setRepeatFieldsVisible(false);
  setPopupMode("add");
  popup.classList.remove("hidden");
  popupShadow.classList.remove("hidden");
  document.body.classList.add("no-scroll");
});

close.addEventListener("click", () => {
  editingReminderId = null;
  popup.classList.add("hidden");
  popupShadow.classList.add("hidden");
  document.body.classList.remove("no-scroll");
});

checkbox.addEventListener("change", () => {
  setRepeatFieldsVisible(checkbox.checked);
});

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const pet_id = localStorage.getItem("selectedPet");
    const title = form.nome.value;
    const datetime = new Date(form.data.value).toISOString();

    let repeat_interval = 0;
    let repeat_unit = null;

    if (checkbox.checked) {
        repeat_interval = parseInt(form.quantidade.value) || 0;
        repeat_unit = form.repeticao.value;
    }

    try {

        const result = editingReminderId
        ? await petAPI.updateReminder({
            id: editingReminderId,
            title,
            datetime,
            repeat_interval,
            repeat_unit
          })
        : await petAPI.addReminder({
            pet_id,
            title,
            datetime,
            repeat_interval,
            repeat_unit
          });

        if (result.success) {
            alert(editingReminderId ? "Lembrete atualizado!" : "Lembrete adicionado!");
            editingReminderId = null;
            form.reset();
            setRepeatFieldsVisible(false);
            popup.classList.add("hidden");
            popupShadow.classList.add("hidden");
            document.body.classList.remove("no-scroll");
            loadReminders();
        }

    }
    catch (error) {
        console.error(error);
        alert("Erro ao salvar lembrete.");
    }

});

function getRepeatUnitLabel(unit) {

    const labels = {
        h: "hora(s)",
        d: "dia(s)",
        w: "semana(s)"
    };

    return labels[unit] || unit;

}

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

function createReminderItem(reminder) {

    const item = document.createElement("div");
    item.className = "reminder-item";

    const title = document.createElement("p");
    title.className = "reminder-title";
    title.textContent = reminder.title;

    const repeatText = document.createElement("p");
    repeatText.className = "reminder-meta";
    repeatText.textContent =
        reminder.repeat_interval > 0 && reminder.repeat_unit
        ? `Repete a cada ${reminder.repeat_interval} ${getRepeatUnitLabel(reminder.repeat_unit)}`
        : "Não repete";

    const nextText = document.createElement("p");
    nextText.className = "reminder-meta";
    nextText.textContent = `Próxima ocorrência: ${formatDateTime(reminder.last_reminder)}`;

    const editButton = document.createElement("button");
    editButton.className = "edit small-button";
    editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="45px" viewBox="0 -960 960 960" width="45px" fill="var(--text)"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;

    editButton.addEventListener("click", () => {

        editingReminderId = reminder.id;

        form.nome.value = reminder.title;
        form.data.value = toDatetimeLocalValue(reminder.last_reminder);

        const hasRepeat = reminder.repeat_interval > 0 && !!reminder.repeat_unit;

        checkbox.checked = hasRepeat;
        form.quantidade.value = hasRepeat ? reminder.repeat_interval : "";
        form.repeticao.value = hasRepeat ? reminder.repeat_unit : "";

        setRepeatFieldsVisible(hasRepeat);
        setPopupMode("edit");

        popup.classList.remove("hidden");
        popupShadow.classList.remove("hidden");
        document.body.classList.add("no-scroll");

    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete small-button";
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="45px" viewBox="0 -960 960 960" width="45px" fill="var(--text)"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg>`;
    
    deleteButton.addEventListener("click", async () => {

    const confirmed = confirm(
        "Deseja excluir este lembrete?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const result =
        await petAPI.deleteReminder(
            reminder.id
        );

        if (result.success) {

            item.remove();

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Erro ao excluir lembrete."
        );

    }

    });

    const content = document.createElement("div");
    content.className = "reminder-content";

    content.appendChild(title);
    content.appendChild(repeatText);
    content.appendChild(nextText);

    const actions = document.createElement("div");
    actions.className = "reminder-actions";

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    item.appendChild(content);
    item.appendChild(actions);

    return item;

}

async function loadReminders() {

    const list = document.getElementById("reminders-list");
    if(!list){
        return;
    }

    const pet_id = localStorage.getItem("selectedPet");
    if(!pet_id){
        return;
    }

    try{

        const result = await petAPI.getReminders(pet_id);

        list.innerHTML = "";

        if(!result || !result.ok || result.reminders.length === 0){
            const empty = document.createElement("p");
            empty.className = "reminder-empty";
            empty.textContent = "Nenhum lembrete cadastrado.";
            list.appendChild(empty);
            return;
        }

        result.reminders.forEach((reminder) => {
            list.appendChild(createReminderItem(reminder));
        });

    }
    catch(error){
        console.error(error);
    }

}

const vaccinePopupShadow = document.getElementById("vaccine-popup-shadow");
const vaccinePopup = document.getElementById("vaccine-popup");
const openVaccine = document.getElementById("openPopup2");
const closeVaccine = document.getElementById("closeVaccinePopup");
const vaccinePopupTitle = document.getElementById("vaccinePopupTitle");
const vaccinePopupSubmitLabel = document.getElementById("vaccinePopupSubmitLabel");

const vaccineCheckbox = document.getElementById("vaccineCheckbox");
const vaccineRepeats = document.querySelectorAll(".vaccine-repeat");
const vaccineBox = document.getElementById("vaccine-popup");
const vaccineForm = document.getElementById("vaccineForm");

let editingVaccineId = null; // null = adding, otherwise the id being edited

function setVaccineNextDoseVisible(visible) {
  vaccineRepeats.forEach(item => item.classList.toggle("hidden", !visible));
  vaccineBox.style.height = visible ? "730px" : "630px";
}

function setVaccinePopupMode(mode) {
  if(mode === "edit"){
    vaccinePopupTitle.textContent = "Editar Vacina";
    vaccinePopupSubmitLabel.textContent = "Salvar Alterações";
  }
  else{
    vaccinePopupTitle.textContent = "Nova Vacina";
    vaccinePopupSubmitLabel.textContent = "Adicionar Vacina";
  }
}

openVaccine.addEventListener("click", () => {
  editingVaccineId = null;
  vaccineForm.reset();
  setVaccineNextDoseVisible(false);
  setVaccinePopupMode("add");
  vaccinePopup.classList.remove("hidden");
  vaccinePopupShadow.classList.remove("hidden");
  document.body.classList.add("no-scroll");
});

closeVaccine.addEventListener("click", () => {
  editingVaccineId = null;
  vaccinePopup.classList.add("hidden");
  vaccinePopupShadow.classList.add("hidden");
  document.body.classList.remove("no-scroll");
});

vaccineCheckbox.addEventListener("change", () => {
  setVaccineNextDoseVisible(vaccineCheckbox.checked);
});

vaccineForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const pet_id = localStorage.getItem("selectedPet");
    const name = vaccineForm.nome.value;
    const date = vaccineForm.data.value;
    const doctor = vaccineForm.medico.value;
    const next_dose = vaccineCheckbox.checked ? vaccineForm.proximaDose.value : null;

    try {

        const result = editingVaccineId
        ? await petAPI.updateVaccine({
            id: editingVaccineId,
            name,
            date,
            doctor,
            next_dose
          })
        : await petAPI.addVaccine({
            pet_id,
            name,
            date,
            doctor,
            next_dose
          });

        if (result.success) {
            alert(editingVaccineId ? "Vacina atualizada!" : "Vacina adicionada!");
            editingVaccineId = null;
            vaccineForm.reset();
            setVaccineNextDoseVisible(false);
            vaccinePopup.classList.add("hidden");
            vaccinePopupShadow.classList.add("hidden");
            document.body.classList.remove("no-scroll");
            loadVaccines();
        }

    }
    catch (error) {
        console.error(error);
        alert("Erro ao salvar vacina.");
    }

});

function formatDateOnly(value) {

    if(!value){
        return "";
    }

    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

}

function createVaccineItem(vaccine) {

    const item = document.createElement("div");
    item.className = "reminder-item";

    const title = document.createElement("p");
    title.className = "reminder-title";
    title.textContent = vaccine.name;

    const doctorText = document.createElement("p");
    doctorText.className = "reminder-meta";
    doctorText.textContent = vaccine.doctor
        ? `Veterinário: ${vaccine.doctor}`
        : "Veterinário não informado";

    const dateText = document.createElement("p");
    dateText.className = "reminder-meta";
    dateText.textContent = `Aplicada em: ${formatDateOnly(vaccine.date)}`;

    const nextDoseText = document.createElement("p");
    nextDoseText.className = "reminder-meta";
    nextDoseText.textContent = vaccine.next_dose
        ? `Próxima dose: ${formatDateOnly(vaccine.next_dose)}`
        : "Sem próxima dose agendada";

    const editButton = document.createElement("button");
    editButton.className = "edit small-button";
    editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="45px" viewBox="0 -960 960 960" width="45px" fill="var(--text)"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;

    editButton.addEventListener("click", () => {

        editingVaccineId = vaccine.id;

        vaccineForm.nome.value = vaccine.name;
        vaccineForm.data.value = vaccine.date;
        vaccineForm.medico.value = vaccine.doctor || "";

        const hasNextDose = !!vaccine.next_dose;

        vaccineCheckbox.checked = hasNextDose;
        vaccineForm.proximaDose.value = hasNextDose ? vaccine.next_dose : "";

        setVaccineNextDoseVisible(hasNextDose);
        setVaccinePopupMode("edit");

        vaccinePopup.classList.remove("hidden");
        vaccinePopupShadow.classList.remove("hidden");
        document.body.classList.add("no-scroll");

    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete small-button";
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="45px" viewBox="0 -960 960 960" width="45px" fill="var(--text)"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg>`;

    deleteButton.addEventListener("click", async () => {

        const confirmed = confirm(
            "Deseja excluir esta vacina?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const result =
            await petAPI.deleteVaccine(
                vaccine.id
            );

            if (result.success) {

                item.remove();

            }

        }
        catch (error) {

            console.error(error);

            alert(
                "Erro ao excluir vacina."
            );

        }

    });

    const content = document.createElement("div");
    content.className = "reminder-content";

    content.appendChild(title);
    content.appendChild(doctorText);
    content.appendChild(dateText);
    content.appendChild(nextDoseText);

    const actions = document.createElement("div");
    actions.className = "reminder-actions";

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    item.appendChild(content);
    item.appendChild(actions);

    return item;

}

async function loadVaccines() {

    const list = document.getElementById("vaccines-list");
    if(!list){
        return;
    }

    const pet_id = localStorage.getItem("selectedPet");
    if(!pet_id){
        return;
    }

    try{

        const result = await petAPI.getVaccines(pet_id);

        list.innerHTML = "";

        if(!result || !result.ok || result.vaccines.length === 0){
            const empty = document.createElement("p");
            empty.className = "reminder-empty";
            empty.textContent = "Nenhuma vacina cadastrada.";
            list.appendChild(empty);
            return;
        }

        result.vaccines.forEach((vaccine) => {
            list.appendChild(createVaccineItem(vaccine));
        });

    }
    catch(error){
        console.error(error);
    }

}

window.addEventListener("DOMContentLoaded", loadVaccines);
window.addEventListener("DOMContentLoaded", loadReminders);
setInterval(loadReminders, 60000); // keep "next occurrence" fresh while the page is open