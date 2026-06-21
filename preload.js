const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld(
"petAPI",
{

    savePet:(pet)=>{
        return ipcRenderer.invoke(
            "save-pet",
            pet
        );
    },

    updatePet:(pet)=>{
    return ipcRenderer.invoke(
        "update-pet",
        pet
    );
    },


    getFilePath:(file)=>{
        return webUtils.getPathForFile(file);
    },

    toFileUrl:(filePath)=>{

        let normalized = filePath.replace(/\\/g, "/");

        if(!normalized.startsWith("/")){
            normalized = "/" + normalized;
        }

        return "file://" + encodeURI(normalized);

    },

    getPets:()=>{

        return ipcRenderer.invoke(
            "get-pets",
        );

    },

    getPet:(id)=>{

        return ipcRenderer.invoke(
            "get-pet",
            id
        );

    },

    delPet:(id)=>{

        return ipcRenderer.invoke(
            "delete-pet",
            id
        );

    },

    onPetsLoaded:(callback)=>{

        ipcRenderer.on(
            "pets-loaded",
            (event,pets)=>{
                callback(pets);
            }
        );

    },

    delALLPet:()=>{

        return ipcRenderer.invoke(
            "delete-ALL-pets",
        );

    },

    addReminder: (reminder) =>
        
    ipcRenderer.invoke(
        "add-reminder",
        reminder
    ),

    getReminders: (pet_id) =>
    ipcRenderer.invoke(
        "get-reminders",
        pet_id
    ),

    deleteReminder: (id) =>

    ipcRenderer.invoke(
        "delete-reminder",
        id
    ),

    updateReminder: (reminder) =>
    ipcRenderer.invoke(
        "update-reminder",
        reminder
    ),

    addVaccine: (vaccine) => ipcRenderer.invoke("add-vaccine", vaccine),
    getVaccines: (pet_id) => ipcRenderer.invoke("get-vaccines", pet_id),
    updateVaccine: (vaccine) => ipcRenderer.invoke("update-vaccine", vaccine),
    deleteVaccine: (id) => ipcRenderer.invoke("delete-vaccine", id),

});