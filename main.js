const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const db = require("./database");
const fs = require("fs");

app.setAppUserModelId("com.petcare.app");

function getPetsFromDatabase() {

    return new Promise((resolve, reject) => {

        db.all(
            "SELECT * FROM pets ORDER BY id DESC",
            [],
            (err, pets) => {

                if(err){
                    reject(err);
                    return;
                }

                resolve(pets);

            }
        );

    });

}

function savePetToDatabase(pet, savedPath) {

    return new Promise((resolve, reject) => {

        db.run(
            `
            INSERT INTO pets
            (name,type,birth_date,sex,photo)
            VALUES(?,?,?,?,?)
            `,
            [
                pet.name,
                pet.type,
                pet.birth_date,
                pet.sex,
                savedPath
            ],

            function(error){

                if(error){
                    reject(error);
                    return;
                }

                resolve(this.lastID);

            }
        );

    });

}

function updatePetInDatabase(pet) {

    return new Promise((resolve, reject) => {

        db.run(
            `
            UPDATE pets
            SET name = ?,
                type = ?,
                birth_date = ?,
                sex = ?,
                photo = ?
            WHERE id = ?
            `,
            [
                pet.name,
                pet.type,
                pet.birth_date,
                pet.sex,
                pet.photo,
                pet.id
            ],
            function(error){

                if(error){
                    reject(error);
                    return;
                }

                resolve({ success: true, changes: this.changes });

            }
        );

    });

}

function normalizeSpecies(value) {

    return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}

function getDefaultPhotoPath(species) {

    const defaultPhotos = {
        gato: "assets/default-cat.svg",
        cachorro: "assets/default-dog.svg",
        coelho: "assets/default-bunny.svg",
        roedor: "assets/default-hamster.svg",
        ave: "assets/default-bird.svg",
        reptil: "assets/default-lizard.svg",
        outro: "assets/default-other.svg"
    };


    const normalizedSpecies =
    normalizeSpecies(species);


    return defaultPhotos[normalizedSpecies] ||
    defaultPhotos.outro;

}

function savePetImage(pet) {

    if(
        !pet ||
        typeof pet.imagePath !== "string" ||
        typeof pet.imageName !== "string" ||
        pet.imagePath.trim() === "" ||
        pet.imageName.trim() === ""
    ){
        return null;
    }

    const imageFolder =
    path.join(__dirname, "images");


    if(!fs.existsSync(imageFolder)){
        fs.mkdirSync(imageFolder);
    }


    const safeImageName =
    path.basename(pet.imageName);


    const newImage =
    path.join(
        imageFolder,
        safeImageName
    );


    fs.copyFileSync(
        pet.imagePath,
        newImage
    );


    return "images/" + safeImageName;

}

function clearPetImages() {

    const imageFolder = path.join(__dirname, "images");

    if(!fs.existsSync(imageFolder)){
        return;
    }

    const files = fs.readdirSync(imageFolder);

    for(const file of files){

        const filePath = path.join(imageFolder, file);

        try{
            if(fs.statSync(filePath).isFile()){
                fs.unlinkSync(filePath);
            }
        }
        catch(error){
            console.log("Erro ao remover imagem:", file, error);
        }

    }

}

function createWindow() {

    const window = new BrowserWindow({

        width: 1000,
        height: 700,

        minWidth: 500,
        minHeight: 500,

        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }

    });

    window.loadFile("pages/index.html");
    
}

function addReminder(
    pet_id,
    title,
    datetime,
    repeat_interval,
    repeat_unit
) {
    console.log("Adding reminder...");

    return new Promise((resolve, reject) => {

        db.run(
            `
            INSERT INTO reminders (
                pet_id,
                title,
                datetime,
                last_reminder,
                repeat_interval,
                repeat_unit
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                pet_id,
                title,
                datetime,
                datetime,          // first occurrence = the chosen datetime
                repeat_interval,
                repeat_unit
            ],
            function (err) {

                if (err) {
                    reject(err);
                    return;
                }

                resolve({ success: true, id: this.lastID });

            }
        );

    });

}

function updateReminder(
    id,
    title,
    datetime,
    repeat_interval,
    repeat_unit
) {

    return new Promise((resolve, reject) => {

        db.run(
            `
            UPDATE reminders
            SET title = ?,
                datetime = ?,
                last_reminder = ?,
                repeat_interval = ?,
                repeat_unit = ?
            WHERE id = ?
            `,
            [
                title,
                datetime,
                datetime,          // editing resets the "next occurrence" anchor
                repeat_interval,
                repeat_unit,
                id
            ],
            function(err){

                if(err){
                    reject(err);
                    return;
                }

                resolve({ success: true, changes: this.changes });

            }
        );

    });

}

const REPEAT_UNIT_MS = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
};

function getIntervalMs(repeat_interval, repeat_unit) {

    const unitMs =
    REPEAT_UNIT_MS[repeat_unit] || 0;

    return unitMs * Number(repeat_interval || 0);

}

// Pure calculation: given a reminder row, returns the up-to-date version
// (does NOT touch the database)
function computeRefreshedReminder(reminder) {

    const hasRepeat =
        Number(reminder.repeat_interval) > 0 &&
        !!reminder.repeat_unit;

    if(!hasRepeat){
        return { reminder, changed: false };
    }

    const intervalMs =
    getIntervalMs(reminder.repeat_interval, reminder.repeat_unit);

    if(intervalMs <= 0){
        return { reminder, changed: false };
    }

    let nextTime =
    new Date(reminder.last_reminder).getTime();

    const now = Date.now();
    let changed = false;

    while(nextTime <= now){
        nextTime += intervalMs;
        changed = true;
    }

    if(!changed){
        return { reminder, changed: false };
    }

    return {
        reminder: {
            ...reminder,
            last_reminder: new Date(nextTime).toISOString()
        },
        changed: true
    };

}

function updateReminderLastOccurrence(id, last_reminder) {

    return new Promise((resolve, reject) => {

        db.run(
            "UPDATE reminders SET last_reminder = ? WHERE id = ?",
            [last_reminder, id],
            function(error){

                if(error){
                    reject(error);
                    return;
                }

                resolve();

            }
        );

    });

}

function addVaccine(pet_id, name, date, doctor, next_dose) {

    return new Promise((resolve, reject) => {

        db.run(
            `
            INSERT INTO vaccines (
                pet_id,
                name,
                date,
                doctor,
                next_dose
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [pet_id, name, date, doctor, next_dose],
            function (err) {

                if (err) {
                    reject(err);
                    return;
                }

                resolve({ success: true, id: this.lastID });

            }
        );

    });

}

function updateVaccine(id, name, date, doctor, next_dose) {

    return new Promise((resolve, reject) => {

        db.run(
            `
            UPDATE vaccines
            SET name = ?,
                date = ?,
                doctor = ?,
                next_dose = ?
            WHERE id = ?
            `,
            [name, date, doctor, next_dose, id],
            function(err){

                if(err){
                    reject(err);
                    return;
                }

                resolve({ success: true, changes: this.changes });

            }
        );

    });

}

function getVaccinesFromDatabase(pet_id) {

    return new Promise((resolve, reject) => {

        db.all(
            "SELECT * FROM vaccines WHERE pet_id = ? ORDER BY date DESC",
            [pet_id],
            (err, vaccines) => {

                if(err){
                    reject(err);
                    return;
                }

                resolve(vaccines);

            }
        );

    });

}

function getRemindersFromDatabase(pet_id) {

    return new Promise((resolve, reject) => {

        db.all(
            "SELECT * FROM reminders WHERE pet_id = ? ORDER BY last_reminder ASC",
            [pet_id],
            (err, reminders) => {

                if(err){
                    reject(err);
                    return;
                }

                resolve(reminders);

            }
        );

    });

}

function getAllRemindersWithPet() {

    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT reminders.*, pets.name AS pet_name
            FROM reminders
            JOIN pets ON pets.id = reminders.pet_id
            `,
            [],
            (err, reminders) => {

                if(err){
                    reject(err);
                    return;
                }

                resolve(reminders);

            }
        );

    });

}

// Tracks which overdue, non-repeating reminders already fired a notification
// this session, so we don't spam every minute.
const notifiedReminders = new Set();

function showReminderNotification(reminder) {

    if(!Notification.isSupported()){
        return;
    }

    const notification =
    new Notification({
        title: "Lembrete: " + reminder.title,
        body: reminder.pet_name
            ? `Hora de cuidar de ${reminder.pet_name}!`
            : "Hora do lembrete!",
        silent: false // plays the OS default notification sound
    });

    notification.show();

}

async function checkAllReminders() {

    console.log("checking reminders", new Date());

    let reminders;

    try{
        reminders = await getAllRemindersWithPet();
    }
    catch(error){
        console.log(error);
        return;
    }

    const now = Date.now();

    for(const reminder of reminders){

        const dueTime = new Date(reminder.last_reminder).getTime();

        console.log(
            `"${reminder.title}" due at ${reminder.last_reminder} -> ${dueTime <= now ? "DUE" : "not due yet"}`
        );

        if(dueTime <= now && !notifiedReminders.has(reminder.id)){

            notifiedReminders.add(reminder.id);

            console.log("Notification.isSupported():", Notification.isSupported());

            showReminderNotification(reminder);

        }

        const { reminder: updated, changed } = computeRefreshedReminder(reminder);

        if(changed){
            await updateReminderLastOccurrence(updated.id, updated.last_reminder);
            notifiedReminders.delete(reminder.id);
        }

    }

}

app.whenReady().then(() => {

    createWindow();

    setTimeout(() => {
        showReminderNotification({ title: "Notificação de Teste", pet_name: null });
    }, 3000);

    // SAVE PET
    ipcMain.handle(
        "save-pet",
        async (event, pet) => {

            try{

                if(!pet || !pet.name || !pet.type){
                    throw new Error("Nome e especie sao obrigatorios.");
                }


                const savedPath =
                savePetImage(pet) ||
                getDefaultPhotoPath(pet.type);


                const id =
                await savePetToDatabase(pet, savedPath);


                console.log(
                    "Saved pet:",
                    id
                );


                return {
                    ok: true,
                    id
                };

            }
            catch(error){

                console.log(error);

                return {
                    ok: false,
                    error: error.message
                };

            }

        }
    );


    // GET PETS
    ipcMain.handle(
        "get-pets",
        async () => {

            try{

                const pets =
                await getPetsFromDatabase();


                return {
                    ok: true,
                    pets
                };

            }
            catch(error){

                console.log(error);

                return {
                    ok: false,
                    error: error.message,
                    pets: []
                };

            }

        }
    );

    ipcMain.handle(
        "get-pet",
        async (event, id) => {

            return new Promise((resolve, reject) => {

                db.get(
                    "SELECT * FROM pets WHERE id = ?",
                    [id],
                    (err, pet) => {

                        if(err){
                            reject(err);
                            return;
                        }

                        resolve(pet);

                    }
                );

            });

        }
    );

    ipcMain.handle(
        "delete-pet",
        async (event, id) => {

            return new Promise((resolve, reject) => {

                db.run(
                    "DELETE FROM pets WHERE id = ?",
                    [id],

                    function(error){

                        if(error){
                            reject(error);
                            return;
                        }

                        resolve({
                            success: true,
                            changes: this.changes
                        });

                    }
                );

            });

        }
    );

    ipcMain.handle("delete-ALL-pets", async () => {

    return new Promise((resolve, reject) => {

        db.serialize(() => {

            db.run("DELETE FROM reminders", (err) => { if(err) reject(err); });
            db.run("DELETE FROM vaccines", (err) => { if(err) reject(err); });

            db.run("DELETE FROM pets", function(error){

                if(error){
                    reject(error);
                    return;
                }

                try{
                    clearPetImages();
                }
                catch(imgError){
                    console.log("Erro ao limpar imagens:", imgError);
                }

                resolve({ success: true, changes: this.changes });

            });

        });

    });

    });

    ipcMain.handle(
    "update-pet",
    async (event, pet) => {

        try{

            if(!pet || !pet.id || !pet.name || !pet.type){
                throw new Error("Nome e especie sao obrigatorios.");
            }

            let photoPath = savePetImage(pet);

            if(!photoPath){

                const hadCustomPhoto =
                pet.photo && !pet.photo.startsWith("assets/default-");

                photoPath =
                hadCustomPhoto ? pet.photo : getDefaultPhotoPath(pet.type);

            }

            const result =
            await updatePetInDatabase({
                id: pet.id,
                name: pet.name,
                type: pet.type,
                birth_date: pet.birth_date,
                sex: pet.sex,
                photo: photoPath
            });

            return { ok: true, ...result };

        }
        catch(error){

            console.log(error);

            return { ok: false, error: error.message };

        }

        }
    );

    ipcMain.handle("add-reminder", async (_, reminder) => {

        console.log("IPC add-reminder received", reminder);

        return await addReminder(
            reminder.pet_id,
            reminder.title,
            reminder.datetime,
            reminder.repeat_interval,
            reminder.repeat_unit
        );

    });

    ipcMain.handle("get-reminders", async (event, pet_id) => {

        try{

            const reminders = await getRemindersFromDatabase(pet_id);
            const updates = [];

            const refreshed = reminders.map((reminder) => {

                const result = computeRefreshedReminder(reminder);

                if(result.changed){
                    updates.push(
                        updateReminderLastOccurrence(result.reminder.id, result.reminder.last_reminder)
                    );
                }

                return result.reminder;

            });

            await Promise.all(updates);

            return { ok: true, reminders: refreshed };

        }
        catch(error){
            console.log(error);
            return { ok: false, error: error.message, reminders: [] };
        }

    });

    ipcMain.handle("delete-reminder", async (_, id) => {

        return new Promise((resolve, reject) => {

            db.run("DELETE FROM reminders WHERE id = ?", [id], function(err) {

                if (err) {
                    reject(err);
                    return;
                }

                resolve({ success: true, changes: this.changes });

            });

        });

    });

    ipcMain.handle("update-reminder", async (_, reminder) => {

        try{
            return await updateReminder(
                reminder.id,
                reminder.title,
                reminder.datetime,
                reminder.repeat_interval,
                reminder.repeat_unit
            );
        }
        catch(error){
            console.log(error);
            return { success: false, error: error.message };
        }

    });

    checkAllReminders();                   // catch up immediately on launch
    setInterval(checkAllReminders, 60000); // then every minute

    ipcMain.handle(
        "add-vaccine",
        async (_, vaccine) => {

            console.log("IPC add-vaccine received", vaccine);

            try{

                return await addVaccine(
                    vaccine.pet_id,
                    vaccine.name,
                    vaccine.date,
                    vaccine.doctor,
                    vaccine.next_dose
                );

            }
            catch(error){

                console.log(error);

                return { success: false, error: error.message };

            }

        }
    );

    ipcMain.handle(
        "get-vaccines",
        async (event, pet_id) => {

            try{

                const vaccines =
                await getVaccinesFromDatabase(pet_id);

                return { ok: true, vaccines };

            }
            catch(error){

                console.log(error);

                return { ok: false, error: error.message, vaccines: [] };

            }

        }
    );

    ipcMain.handle(
        "update-vaccine",
        async (_, vaccine) => {

            try{

                return await updateVaccine(
                    vaccine.id,
                    vaccine.name,
                    vaccine.date,
                    vaccine.doctor,
                    vaccine.next_dose
                );

            }
            catch(error){

                console.log(error);

                return { success: false, error: error.message };

            }

        }
    );

    ipcMain.handle(
        "delete-vaccine",
        async (_, id) => {

            return new Promise((resolve, reject) => {

                db.run(
                    "DELETE FROM vaccines WHERE id = ?",
                    [id],

                    function(err) {

                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve({
                            success: true,
                            changes: this.changes
                        });

                    }
                );

            });

        }
    );

});

