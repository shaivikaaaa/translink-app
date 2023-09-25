//IMPORTING LIBRARIES
import fs_promise from "fs/promises";
import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import {parse} from 'csv-parse/sync';
import promptSync from "prompt-sync";
const prompt = promptSync({sigint: true})
//-------------------------------------------------------------------------------

/**
 * Retrieve a list of files from the cache folder.
 *
 * @function
 * @returns {string[]} An array of filenames in the cache folder.
 * @throws {Error} If there is an error while listing files in the cache folder.
 */

function retrieveFilesFromCache() {
    const cacheFolderPath = 'cached-data'; // Replace with your actual cache folder path
    try {
        return fs.readdirSync(cacheFolderPath);
    } catch (error) {
        console.error('Error listing files in cache folder:', error);
        return [];
    }
}
// -----------------------------------------------------------------------------------------

/**
 * Deletes files from a specified cache folder.
 *
 * @param {string[]} filesToDelete - An array of filenames to delete from the cache folder.
 * @returns {void}
 * 
 */

function deleteCachedFiles(filesToDelete) {
    const cacheFolderPath = 'cached-data'; // Replace with your actual cache folder path
    filesToDelete.forEach((filename) => {
        const filePath = path.join(cacheFolderPath, filename);
        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
        } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
        }
    });
}

// -----------------------------------------------------------------------------------------

/**
 * Periodically deletes files from the cache folder after every 5 minutes.
 * This function retrieves the list of files from the cache folder using
 * the `retrieveFilesFromCache` function and deletes them using the
 * `deleteCachedFiles` function.
 *
 * @function
 * @returns {void}
 */

function deletingAfter5Minutes() {
    setInterval(() => {
        const filesToDelete = retrieveFilesFromCache();
        if (filesToDelete.length > 0) {
            console.log(`Deleting ${filesToDelete.length} files from the cache folder.`);
            deleteCachedFiles(filesToDelete);
        }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
}


// -----------------------------------------------------------------------------------------

/**
 * Prompt the user to decide whether to search for bus routes again or exit the program.
 * If the user chooses to search again (by entering "yes" or "y"), it calls the main function to restart the program.
 * If the user chooses to exit (by entering "no" or "n"), it displays a thank you message and exits.
 * If the user provides an invalid option, it prompts them to enter a valid option until a valid response is received.
 * @returns {void}
 */

function SearchAgain() 
{
    const answer = prompt("Would you like to search again? (yes/no)").toLowerCase();
  
    if (answer === "y" || answer === "yes") {
      main(); // Call the main function to run the program again
    } else if (answer === "n" || answer === "no") {
      console.log("Thanks for using the UQ Lakes station bus tracker!");
      process.exit(0);
    } else {
      console.log("Please enter a valid option.");
      SearchAgain();
    }
  }

//  ------------------------------------------------------------------

async function main ()
{

//  ------------------------------------------------------------------
/**
 * @function is called as soon as the program starts to run
 * this is to ensure that the timer to delete the cached files gets started and does not exceed maximum time
 * @returns {void}
 */
    deletingAfter5Minutes();
//  ------------------------------------------------------------------

/**
 * Fetches JSON data from the specified URL.
 *
 * @param {string} url - The URL to fetch JSON data from.
 * @returns {Promise<any>} A promise that resolves to the JSON data fetched from the URL.
 */
    
        async function fetchingLiveData(url) 
    {
        let response = await fetch(url);
        let JSONResponse = await response.json();
        return JSONResponse;
    }

// -----------------------------------------------------------

/**
 * This function asynchronously reads a JSON cache file with the specified filename.
 * @param {string} filenameAppend - The string to append to the JSON filename.
 * @returns {Promise<string|null>} A Promise that resolves with the JSON data from the cache file if successful, or null if an error occurs.
 */

   async function ReadingFromCache(filenameAAppend) {
    try {
        const data = await fs.readFile(jsonFilename(filenameAppend));
        console.log(ReadingFromCache(filenameAppend));
        return data;
    }
    catch(error) {
        console.log(error);
    }
  }
// -----------------------------------------------------------------------

/**
 * Saves data to a JSON cache file with the specified filename.
 * @param {string} filenameAppend - The string to append to the JSON filename.
 * @param {any} data - The data to be saved as JSON.
 * @returns {Promise<void>} A promise that resolves when the data is successfully saved.
 */

    async function SavingFromCache(filenameAppend, data) 
    {
        /**
        * This function asynchronously writes the provided data as JSON to a cache file
        * with the specified filename.
        *
        * @async
        * @function
        * @name SavingFromCache
        * @param {string} filenameAppend - The string to append to the JSON filename.
        * @param {any} data - The data to be saved as JSON.
        * @throws {Error} If there is an error while writing the cache file.
        */

        console.log("in save-cache")
        try 
        {
            await fs_promise.writeFile(filenameAppend, JSON.stringify(data));
        }
        catch(error) 
        {
            console.log(error);
        }
    }

// -----------------------------------------------------------------------
/**
 * Fetch live bus data from specified URLs and save them to cache.
 * This function fetches data from two URLs: vehicle positions and trip updates,
 * then saves them to cache files for later use.
 *
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves when the live data is fetched and cached.
 * @throws {Error} If there is an error during the fetching or caching process.
 */

    async function getlivedata()
    {
        console.log("get in live data");
        const vehiclePositions = await fetchingLiveData('http://127.0.0.1:5343/gtfs/seq/vehicle_positions.json');
        const tripupdates = await fetchingLiveData('http://127.0.0.1:5343/gtfs/seq/trip_updates.json');
        await SavingFromCache('cached-data/vehiclePositions.json', vehiclePositions);
        await SavingFromCache('cached-data/tripupdates.json', tripupdates);
    
    
    }
// -------------------------------------------------------------------------------

/**
 * Asynchronously fetches live arrival time and location data from a cached JSON file.
 *
 * @async
 * @returns {Promise<Array<Object>|null>} An array of objects containing live arrival time and location data,
 *   or null if there is no valid data or an error occurs.
 * @throws {Error} If there is an error reading the vehicle position data.
 */

    async function fetchingLive_Arrival_and_Location() {
        try {
            const vehiclePositionData = await fs_promise.readFile('cached-data/vehiclePositions.json', 'utf8');
            const vehiclePositionJson = JSON.parse(vehiclePositionData);
    
            
            if (vehiclePositionJson.entity && Array.isArray(vehiclePositionJson.entity)) {
                const liveData = [];
    
                // Iterating over each entity to extract data
                vehiclePositionJson.entity.forEach(entity => {
                    if (entity.vehicle && entity.vehicle.position) {
                        const liveArrivalTime = entity.vehicle.timestamp; // Change this to the correct property
                        const liveLocation = {
                            latitude: entity.vehicle.position.latitude,
                            longitude: entity.vehicle.position.longitude,
                        };
    
                        // Creating an object with live data
                        const data = {
                            liveArrivalTime,
                            liveLocation,
                        };
    
                        // Adding the object to the liveData array
                        liveData.push(data);
                    }
                });
    
                if (liveData.length > 0) {
                    // Return the array of live data
                    console.log("Live Arrival Time and Location Data:", liveData);
                    return liveData;
                } else {
                    console.error('No live data found in vehicle position data.');
                    return null;
                }
            } else {
                console.error('Invalid structure in vehicle position data.');
                return null;
            }
        } catch (error) {
            console.error('Error reading vehicle position data:', error);
            return null;
        }
    }
    
   
  // ------------------------------------------------------------------------------------------------ 

/**
 * Parses a CSV file and returns the data as an array of objects.
 *
 * @param {string} file - The path to the CSV file to be parsed.
 * @returns {Array<Object>} An array of objects representing the CSV data.
 */

    const parseCSV = (file) => {
        const data = fs.readFileSync(file, 'utf8');
        return parse(data, {
            columns: true
        });
    }
// --------------------------------------------------------------

/**
 * Joins two arrays of objects based on a common field and merges specified fields.
 * @param {Array} array1 - The first array of objects.
 * @param {Array} array2 - The second array of objects.
 * @param {string} joinOnField - The field to join the arrays on.
 * @param {Array} fieldsToMerge - The fields to merge from array2 to array1.
 * @returns {Array} The merged array of objects.
 */

    function join(array1, array2, joinOnField, fieldsToMerge) {
        return array1.map(item1 => {
            const item2 = array2.find(item2 => item1[joinOnField] === item2[joinOnField]);
    
            if (item2) {
                const merged = {};
                for (const field of fieldsToMerge) {
                    if (item2.hasOwnProperty(field)) {
                        merged[field] = item2[field];
                    }
                }
                return {
                    ...item1,
                    ...merged
                }
            }
            return null;
        }).filter(item => item != null);
    }
// -----------------------------------------------------------

/**
 * Prompt the user for a valid date in YYYY-MM-DD format.
 * @parameters none passed/required
 * @returns {string} The valid date in YYYY-MM-DD format.
 */

function isValidDate()
 {
    const date = prompt("What date will you depart UQ Lakes station by bus?")
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!regex.test(date))
    {
        console.log("Incorrect date format. Please use YYYY-MM-DD")
        isValidDate();
    }
    else
    {
        const [year,month,day]=date.split('-').map(Number);
        //month checking
        if(month<1 || month>12)
        {
            console.log("Invalid month.Please enter month between {1-12} ")
            return isValidDate();
        }
        else
        {
            const FindingmaxDaysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > FindingmaxDaysInMonth) {
                console.log("Invalid day. Please enter a valid day for the selected month.");
                return isValidDate(); // Return the result of the recursive call
            } else 
            {
                if(year<2023 || year > 2023)
                {
                    console.log("Invalid year.")
                    isValidDate();
                }
                else
                {
                    return date;
                }
            }
        }
        return date;
    }

 }

//-------------------------------------------------------------------------------

/**
 * Prompt the user to enter a valid time in the format HH:MM.
 * @parameters none passed/required
 * @returns {string} A valid time in HH:MM format.
 */

function isValidTime() {
    let time;
    let validTime = false;
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    while (!validTime) {
        time = prompt("What time will you depart UQ Lakes station by bus? (HH:MM)");

        if (timeRegex.test(time)) {
            validTime = true; // The input is valid, exit the loop
        } else {
            console.log("Incorrect time format. Please use HH:MM");
        }
    }

    return time; 
}

//-------------------------------------------------------------------------------

/**
 * Displays available bus routes.
 */

const availableRoutes ={
    1:"Show all routes",
    2:"66",
    3:"192",
    4:"169",
    5:"209",
    6:"29",
    7:"P332",
    9:"139",
    10:"28",

};

/**
 * Asks the user to enter their preferred bus route and validates it.
 * @parameters none required/needed
 * @returns {string} The selected bus route or null if not valid.
 */

function showRoutes()
{
    for(const i in availableRoutes)
    {
        console.log(i + ": " + availableRoutes[i]);
    }
    
}

 /* 
Asking the user to enter the preferred route(if any) to chose 
{*}no parameter required
returns the route entered by user after cross-checking if it is in the options available
*/

function isValidRoute()
 {
    const routee = prompt("What Bus Route would you like to take?")
    
    
    if (!isNaN(routee))
    {
        const number=parseInt(routee)
        if (number in availableRoutes)
        {
            console.log(availableRoutes[number]);
            return  availableRoutes[number];
        }
        else
        {
            console.log("Please enter a valid option for a bus route.");
            isValidRoute();
        }
       
    }
    else
    {
        console.error("Please enter a valid option for a bus route.");
        isValidRoute();
    }

 }

 /**
 * Filters a dataset of routes based on the target route or displays all routes.
 *
 * @param {Array} dataset - The dataset containing route information.
 * @param {string} targetRoute - The target route to filter by. Use "Show all routes" to display all routes.
 * @returns {Array} An array containing the filtered routes.
 */

 function specificRoute(dataset, targetRoute)
{
    const routes_names_uq=["66","192","169","209","139","29","P332","28"];

     if(targetRoute=="Show all routes")
     {
        //  console.log("show all")
         return dataset.filter(item => routes_names_uq.includes(item.route_short_name))
            
     }
     else
     {
         console.log("target",targetRoute)
         return dataset.filter(item => item.route_short_name == targetRoute); 
     }
 }

//-------------------------------------------------------------------------------

/**
 * Combines live data with static data.
 * @param {Array} liveData - An array of live data objects.
 * @param {Array} staticData - An array of static data objects.
 * @returns {Array} - An array of combined data objects.
 */

 function combiningLiveData_and_StaticData(liveData, StaticData) {
    // Assuming that the liveData and StaticData have matching elements
    // You may need to adjust this logic based on your data structure

    if (!liveData || !Array.isArray(liveData) || liveData.length === 0) {
        console.error('No live data available.');
        return StaticData;
    }

    // Assuming that the liveData and StaticData have the same length and order
    const combinedData = StaticData.map((item, index) => ({
        ...item,
        liveArrivalTime: liveData[index].liveArrivalTime,
        liveLocation: liveData[index].liveLocation,
    }));

    return combinedData;
}


//-------------------------------------------------------------------------------
console.log("Welcome to the UQ Lakes station bus tracker!")
//-------------------------------------------------------------------------------

/**
 * Asynchronously parse CSV files and store the results in variables.
 *
 * @async
 * @function parseCSVFiles
 * @returns {Promise<Array>} A Promise that resolves to an array containing parsed data from CSV files.
 * @throws {Error} If there is an issue parsing any of the CSV files.
 */

 const [
        routes,
        trips,calendar,stop_times,stops
      ] = await Promise.all([
        parseCSV('static-data/routes.txt'),
        parseCSV('static-data/trips.txt'),
        parseCSV('static-data/calendar.txt'),
        parseCSV('static-data/stop_times.txt'),
        parseCSV('static-data/stops.txt')
      ]);

//-------------------------------------------------------------------------------

/**
 * Get a valid date , time, bus route from user input.
 * @returns {string} The valid date in 'YYYYMMDD' format.
 */

const validDate = isValidDate();

const validTime = isValidTime();

showRoutes();

const routee=isValidRoute();

/**
 * Get a specific route from the list of routes.
 * @param {array} routesData - The list of routes data.
 * @param {string} route - The specific route to filter by.
 * @returns {array} The filtered dataset of routes.
 */

const specificRouteAns=specificRoute(routes, routee); // Display the filtered dataset

/**
 * Convert a valid date to a string format as stored in CSV files.
 * @param {string} validDate - The valid date in 'YYYY-MM-DD' format.
 * @returns {string} The date in 'YYYYMMDD' format.
 */
 
const validDataAsString = validDate.split('-').join('')

//-------------------------------------------------------------------------------

/**
 * An array of columns to include when combining routes and trips data.
 * @type {string[]}
 */

const clmns_included_for_routes_and_trips = ['route_short_name', 'route_long_name', 'route_type'];

/**
 * An array of columns to include when combining calendar and trips data.
 * @type {string[]}
 */

const clmns_included_for_calendar_and_trips = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
        'start_date',
        'end_date'
    ];

/**
 * An array of columns to include when combining stopTimes and stops data.
 * @type {string[]}
 */

const clmns_included_for_stopTimes_and_stops=['arrival_time','departure_time'];

/**
 * An array of stop IDs representing UQ bus stations.
 * @type {string[]}
 */

const stopIds = ["1878", "1853", "1947", "1882"];

/**
 * Reduces the size of the stop_times data by filtering only UQ bus stations.
 * @type {Object[]} An array of filtered stop_times data.
 */

 let uq_stop_times = stop_times.filter(service => stopIds.includes(service.stop_id));



//  -------------------------------------------------------------------------------------

/**
 * Combine and filter data from multiple sources based on specified criteria.
 *
 * @param {Array} source1 - The first source data array.
 * @param {Array} source2 - The second source data array to be joined with the first.
 * @param {string} joinKey - The key on which the two data sources should be joined.
 * @param {Array} includedColumns - An array of column names to include in the resulting data.
 * @returns {Array} The filtered and combined data based on the provided criteria.
 */

let combined_data = join(trips, routes, 'route_id', clmns_included_for_routes_and_trips)

/**
 * Further combine and filter data from multiple sources based on specified criteria.
 *
 * @param {Array} source1 - The first source data array.
 * @param {Array} source2 - The second source data array to be joined with the first.
 * @param {string} joinKey - The key on which the two data sources should be joined.
 * @param {Array} includedColumns - An array of column names to include in the resulting data.
 * @returns {Array} The filtered and combined data based on the provided criteria.
 */

combined_data = join(combined_data, calendar, 'service_id', clmns_included_for_calendar_and_trips)

/**
 * Further combine and filter data from multiple sources based on specified criteria.
 *
 * @param {Array} source1 - The first source data array.
 * @param {Array} source2 - The second source data array to be joined with the first.
 * @param {string} joinKey - The key on which the two data sources should be joined.
 * @param {Array} includedColumns - An array of column names to include in the resulting data.
 * @returns {Array} The filtered and combined data based on the provided criteria.
 */

let combined_data2 = join(combined_data, uq_stop_times ,'trip_id', clmns_included_for_stopTimes_and_stops)

// ------------------------------------------------------------------------------------

/**
 * Filter the combined data based on date criteria.
 *
 * @param {Array} data - The data array to be filtered.
 * @param {string} validDataAsString - The valid date in 'YYYYMMDD' format.
 * @returns {Array} The filtered data based on the date criteria.
 */ 

combined_data2=combined_data2.filter(service => 
                        (parseInt(service.start_date,10)<= parseInt(validDataAsString,10)) &&
                        (parseInt(validDataAsString,10)<= parseInt(service.end_date,10))
                        
                        );

//  -------------------------------------------------------------------------------------

/**
 * Filters items in the combined_data2 array based on the arrival time within a 10-minute window.
 * @param {Array} combined_data2 - The array of data to filter.
 * @param {string} validTime - The valid time in HH:MM format for comparison.
 * @returns {Array} An array of filtered items that meet the time criteria.
 */

 let TimeFilteration = combined_data2.filter(item => {
    if (item.arrival_time === undefined) {
        console.log("Skipping item due to undefined arrival time");
        return false; // Skip items with undefined arrival_time
    }

    // Using a fixed time zone for all time calculations ie UTC 
    const today = new Date().toISOString().split('T')[0];
    const DateTimeObj = new Date(`${today}T${validTime}:00Z`);
    const Timeobj = item.arrival_time;
    
    // Convert service arrival time to a date object (using the current date)
    const serviceTime = new Date(`${today}T${Timeobj}Z`);
    
    // Time difference calculation in minutes
    const TimeDifference = (serviceTime - DateTimeObj) / 60000;
    
    // Check if the time difference is within 10 minutes and is not in the past relative to validTime
    return (TimeDifference >= 0 && TimeDifference <= 10);
});

// ---------------------------------------------------------------

/** 
 * Get the day of the week based on a valid date and filter an array of objects by that day.
 * @param {string} validDate - A valid date in the format 'YYYY-MM-DD'.
 * @param {Array<Object>} TimeFilteration - An array of objects to filter.
 * @returns {Array<Object>} An array of objects filtered by the specified day.
*/

const realDate= new Date(validDate);
const dayss= {weekday : 'long'}
const day = realDate.toLocaleString('en-US', dayss).toLowerCase();
console.log(day)

const filteredByDay=TimeFilteration.filter(service => (service[day]==="1"))

//  ------------------------------------------------------------------------

/**
 * Filter the dataset to retrieve specific bus route data based on user input.
 *
 * @param {Array} dataset - The dataset to filter.
 * @param {string} targetRoute - The target bus route to filter for.
 * @returns {Array} An array containing the filtered bus route data.
 */

const temp=specificRoute(filteredByDay,routee);

/**
 * Fetch live bus data asynchronously and store it in cache.
 *
 * @returns {Promise} A promise that resolves when live data is successfully fetched and cached.
 */

await getlivedata();

// ----------------------------------------------------------------------

/**
 * Generates static data based on a filtered dataset.
 *
 * @param {Array} temp - The filtered dataset used to generate static data.
 * @returns {Array} An array of static data objects with specific properties.
 */

const StaticData= temp.map(item => ({
    route_id:item.route_id,
    service_id:item.service_id,
    trip_id:item.trip_id,
    trip_headsign:item.trip_headsign,
    route_short_name:item.route_short_name,
    route_long_name:item.route_long_name

}));

/**
 * Fetches live arrival and location data.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of live data objects
 * containing arrival times and locations.
 */

const liveData = await fetchingLive_Arrival_and_Location();

/**
 * Combines live data with static data to create a single dataset with live arrival times and locations.
 *
 * @param {Array} liveData - The live arrival and location data to combine.
 * @param {Array} staticData - The static data to combine with live data.
 * @returns {Array} An array of objects containing both live and static data.
 */

const StaticDataWithLiveData = combiningLiveData_and_StaticData(liveData, StaticData);

// Display the combined data in a table format
 console.table(StaticDataWithLiveData);

//-------------------------------------------------------------------------------

/** 
 * Prompt the user to decide whether they want to search again or exit the program.
 * This function asks the user for input and either restarts the main program or ends it based on their choice.
 * @returns {void} This function does not return a value.
*/

SearchAgain();
}
// ------------------------------------------------------------

/**
 * The main function that coordinates the execution of the bus tracking program.
 * @async
 */

main();

// ------------------------------------------------------------