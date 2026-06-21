const form = document.getElementById("petForm");

const fileInput = document.getElementById("file-upload");

const speciesInput = document.getElementById("especie");

const previewBox = document.querySelector(".big-image");

let selectedPreviewUrl = null;


const defaultPetImages = {
    gato: "../assets/default-cat.svg",
    cachorro: "../assets/default-dog.svg",
    coelho: "../assets/default-bunny.svg",
    roedor: "../assets/default-hamster.svg",
    ave: "../assets/default-bird.svg",
    reptil: "../assets/default-lizard.svg",
    outro: "../assets/default-other.svg"
};


function normalizeSpecies(value) {

    return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}


function setPreviewImage(imagePath) {

    if(!previewBox){
        return;
    }


    previewBox.style.backgroundImage =
    imagePath
    ? `url("${imagePath}")`
    : "";

}


function clearUploadedPreview() {

    if(selectedPreviewUrl){
        URL.revokeObjectURL(selectedPreviewUrl);
        selectedPreviewUrl = null;
    }

}


function updateSpeciesPreview() {

    if(!speciesInput){
        setPreviewImage(null);
        return;
    }


    const species =
    normalizeSpecies(speciesInput.value);


    setPreviewImage(
        defaultPetImages[species] || null
    );

}


function updateUploadPreview() {

    clearUploadedPreview();


    const file =
    fileInput && fileInput.files.length > 0
    ? fileInput.files[0]
    : null;


    if(file){
        selectedPreviewUrl = URL.createObjectURL(file);
        setPreviewImage(selectedPreviewUrl);
        return;
    }


    updateSpeciesPreview();

}


function getSelectedFilePath(file) {

    if(!file){
        return null;
    }


    try{

        if(window.petAPI && petAPI.getFilePath){
            return petAPI.getFilePath(file);
        }

    }
    catch(error){
        console.log(error);
    }


    return typeof file.path === "string"
    ? file.path
    : null;

}


if(speciesInput){

    speciesInput.addEventListener("change", ()=>{

        const hasUploadedFile =
        fileInput && fileInput.files.length > 0;

        if(!hasUploadedFile){
            updateSpeciesPreview();
        }

    });

}


if(fileInput){

    fileInput.addEventListener(
        "change",
        updateUploadPreview
    );

}


if(form){

    form.addEventListener("reset", ()=>{

        clearUploadedPreview();

        setTimeout(()=>{
            setPreviewImage(null);
        }, 0);

    });

    form.addEventListener("submit", async (event)=>{

        event.preventDefault();

        const file =
        fileInput && fileInput.files.length > 0
        ? fileInput.files[0]
        : null;


        const imagePath =
        getSelectedFilePath(file);


        const pet = {

            name:
            document.querySelector('[name="nome"]').value.trim(),

            type:
            document.getElementById("especie").value,

            sex:
            document.getElementById("sexo").value,

            birth_date:
            document.querySelector('[name="dataNasc"]').value,

            imagePath:
            imagePath,

            imageName:
            file && typeof file.name === "string"
            ? file.name
            : null

        };


        try{

            if(!window.petAPI){
                throw new Error("Abra o app pelo Electron para salvar pets.");
            }


            const result =
            await petAPI.savePet(pet);


            if(result && result.ok){
                alert("Pet salvo com sucesso!");
                window.location.href = "index.html";
                return;
            }


            alert(
                "Nao foi possivel salvar o pet: " +
                (result && result.error ? result.error : "erro desconhecido")
            );

        }
        catch(error){

            alert(
                "Nao foi possivel salvar o pet: " +
                error.message
            );

        }

    });

}
