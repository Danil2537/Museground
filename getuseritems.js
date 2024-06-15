const { pool } = require("./dbConfig");


function formatDate(date) {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`; // Customize the format as needed
}

function queryDatabase(query, params) {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.rows[0]);
            }
        });
    });
}

async function getTrack(trackid) {
    return queryDatabase(`SELECT * FROM museground.track WHERE trackid = $1`, [trackid]);
}

async function getSample(sampleid) {
    return queryDatabase(`SELECT * FROM museground.sample WHERE sampleid = $1`, [sampleid]);
}

async function getPack(packid) {
    return queryDatabase(`SELECT * FROM museground.pack WHERE packid = $1`, [packid]);
}

async function getPreset(presetid) {
    return queryDatabase(`SELECT * FROM museground.preset WHERE presetid = $1`, [presetid]);
}

async function getPlugin(vstid) {
    return queryDatabase(`SELECT * FROM museground.plugin WHERE vstid = $1`, [vstid]);
}

async function getUserItems(userId) {
    const tracksPromises = [];
    const samplesPromises = [];
    const packsPromises = [];
    const presetsPromises = [];
    const pluginsPromises = [];

    try {
        const downloadResult = await pool.query(
            `SELECT * FROM museground.user_downloads WHERE userid = $1;`,
            [userId]
        );

        downloadResult.rows.forEach(row => {
            switch (row.itemtype) {
                case 'track':
                    tracksPromises.push(getTrack(row.itemid));
                    break;
                case 'sample':
                    samplesPromises.push(getSample(row.itemid));
                    break;
                case 'pack':
                    packsPromises.push(getPack(row.itemid));
                    break;
                case 'preset':
                    presetsPromises.push(getPreset(row.itemid));
                    break;
                case 'plugin':
                    pluginsPromises.push(getPlugin(row.itemid));
                    break;
                default:
                    console.warn(`Unknown item type: ${row.itemtype}`);
            }
        });

        const tracks = await Promise.all(tracksPromises);
        const samples = await Promise.all(samplesPromises);
        const packs = await Promise.all(packsPromises);
        const presets = await Promise.all(presetsPromises);
        const plugins = await Promise.all(pluginsPromises);

        tracks.forEach(track => {
            track.dateadded = formatDate(new Date(track.dateadded));
            track.datecreated = formatDate(new Date(track.datecreated));
        });


        return { tracks, samples, packs, presets, plugins };
    } catch (err) {
        console.error('Error fetching user items:', err);
        throw err;
    }
}

module.exports = { getUserItems };
