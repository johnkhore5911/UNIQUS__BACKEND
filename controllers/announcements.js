const { Announcemnet } = require('../models/Announcement')
const Class = require('../models/Classroom')
const { User } = require('../models/User')



const postAnnouncement = async (req, res, next) => {

    const message = req.body.message;
    const classID = req.params.classid;

    const dataObject = { message, classID }
    

    try {

        const classroom = await Class.findById(classID);

        if (!classroom) {
            res.status(404).json({ message: "No classroom found" })
        }

        const announcement = new Announcemnet({
            message: message,
            classID: classID
        });

        announcement.save()
        // console.log("Saved Successfully")



        classroom.announcements.push(announcement._id)

        classroom.save()

        // console.log("classroom append done")

        res.status(200).json({ message: "saved successfully" })

    } catch (err) {
        console.log(err)
    }

}

const fetchAllAnnouncements = async (req, res, next) => {

    const userID = req.user.userID;

    const user = await User.findById(userID)

    if (!user) {
        res.status(404).json({ message: "No user found" })
    }

    const classArray = user.classroomsArray;

    let AnnouncementsArray = []
    for (const i in classArray) {

        const classid = classArray[i].toString();
        const fetchedClass = await Class.findById(classid);

        const announcementsArray = fetchedClass.announcements;

        let arrayofIDs = []
        for (const i in announcementsArray) {
            arrayofIDs.push(announcementsArray[i].toString())
        }

        for (const i in arrayofIDs) {
            
            const fetchedAnnouncement = await Announcemnet.findById(arrayofIDs[i])
            const message = fetchedAnnouncement.message;
            const isRead = fetchedAnnouncement.isRead;
            const createdAt = fetchedAnnouncement.createdAt;
            const className = fetchedClass.title;

            AnnouncementsArray.push({ createdAt, isRead, createdAt, className, message })
        }


    }

    // Sorting the array based on 'createdAt' parameter (date and time) in descending order
    AnnouncementsArray.sort((a, b) => {
        const dateComparison = b.createdAt - a.createdAt;

        if (dateComparison === 0) {
            // If dates are the same, compare based on time
            const timeA = a.createdAt.getHours() * 60 + a.createdAt.getMinutes();
            const timeB = b.createdAt.getHours() * 60 + b.createdAt.getMinutes();
            return timeB - timeA;
        }

        return dateComparison;
    });

    // Print the sorted array
    // console.log(AnnouncementsArray);

    res.status(200).json({ data: AnnouncementsArray })
}

const fetchAnnouncements = async (req, res, next) => {
    const userID = req.user.userID;

    try {
        const user = await User.findById(userID);
        let loadAll = true;
        let comp_announcements = [];
        if (!user) {
            return res.status(404).json({ message: "No user found" });
        }

        const classArray = user.classroomsArray;
        let AnnouncementsArray = [];

        const currentDate = req.query.currentDate || new Date().toISOString();
        const currentDateObject = new Date(currentDate);

        // Subtracting 1 day in milliseconds (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
        const previousDateObject = new Date(currentDateObject.getTime() - (24 * 60 * 60 * 1000));

        for (const classId of classArray) {
            const fetchedClass = await Class.findById(classId);

            if (!fetchedClass) {
                // console.log(`Class with ID ${classId} not found.`);
                continue;
            }

            const announcementsArray = fetchedClass.announcements.map(announcementId => announcementId.toString());

            for (const announcementId of announcementsArray) {
                const fetchedAnnouncement = await Announcemnet.findById(announcementId);

                if (!fetchedAnnouncement) {
                    // console.log(`Announcement with ID ${announcementId} not found.`);
                    continue;
                }

                const message = fetchedAnnouncement.message;
                const isRead = fetchedAnnouncement.isRead;
                const createdAt = fetchedAnnouncement.createdAt;
                const className = fetchedClass.title;
                comp_announcements.push({ createdAt, isRead, className, message })
                // Check if the announcement's date is within the specified day
                const announcementDate = createdAt.toISOString().split('T')[0];
                const TodaysDate = currentDate.split('T')[0];
                const yesterdayDate = previousDateObject.toISOString().split('T')[0];
               
                if (announcementDate === TodaysDate || announcementDate === yesterdayDate) {
                    AnnouncementsArray.push({ createdAt, isRead, className, message });
                }
            }
        }
        if(AnnouncementsArray.length == comp_announcements.length){
            loadAll = false;
        }

        // Sorting the array based on 'createdAt' parameter (date and time) in descending order
        AnnouncementsArray.sort((a, b) => {
            const dateComparison = b.createdAt - a.createdAt;

            if (dateComparison === 0) {
                // If dates are the same, compare based on time
                const timeA = a.createdAt.getHours() * 60 + a.createdAt.getMinutes();
                const timeB = b.createdAt.getHours() * 60 + b.createdAt.getMinutes();
                return timeB - timeA;
            }

            return dateComparison;
        });

        // Print the sorted array
        // console.log(AnnouncementsArray);
        // console.log(loadAll);
        res.status(200).json({ data: AnnouncementsArray ,loadAll:loadAll});
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}

module.exports = {
    postAnnouncement,
    fetchAllAnnouncements,
    fetchAnnouncements
};