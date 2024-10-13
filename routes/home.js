const express = require('express');
// const passport = require('passport');         
// require('../passport');   
   
const router = express.Router();
const multer = require('multer');
const path = require('path');  
const home = require('../controllers/home')

const { createClassroom, fetchClassroom, fetchCurriculum, addTopic, addExtractedQuestions, fetchExtractedQuestions, addChapter, deleteTopic, deleteChapter, allowChapterExcess, FetchTopicInsideChapter, deleteClassRoom } = require('../controllers/classroom')
const { generateLinkforJoiningClass,  joinClassroom, handlejoinrequest, getclasstojoin, getAllJoinRequests, LeaveClassroom, RemoveStudentfromClassroom, } = require('../controllers/addStudent')
const { addAssignmentToClassroom, getAssignment, submitAssignment, submitResponse, markforReview, clearResponse, fetchAllAssignments, assignmentResponse} = require('../controllers/assignment')
const { userProfile, updateProfile } = require('../controllers/userProfileController');
const { fetchAllClassMetaData, fetchStudentList, fetchStudentProfile } = require('../controllers/studentDatabase');  

// Notes route
const {uploadFile,downloadFile} = require('../controllers/notes');  
const { postAnnouncement, fetchAllAnnouncements, fetchAnnouncements } = require('../controllers/announcements');     

// Videos route 
const {uploadVideo,videoFileData} = require('../controllers/video');
const { addTestToClassroom, fetchAllTests, getTest, submitTestResponse, clearTestResponse, markforReviewTest, submitTest, testMetaData, FetchQuestionsByChapter, submitStudentTest, getStudentResult, getResultForTeacher } = require('../controllers/testController');
const {deleteTest, deleteVideo, deleteNote, deleteAssignment} = require('../controllers/deleteResources')
const {getData} = require('../controllers/dashboard');
const { fetchNotifications } = require('../controllers/notifications');

// Set up multer storage for notes  
const storage = multer.diskStorage({
    destination: (req, file, cb) => {      
      cb(null, 'uploads/notes/'); // specify the destination folder
    },   
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extname = path.extname(file.originalname);   
      cb(null, file.fieldname + '-' + uniqueSuffix + extname); // generate unique filename       
    },
  });

// Define file filter to allow only PDF and DOCX files
const fileFilter = function (req, file, cb) {
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'      
  ) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

// Define size limit (e.g., 5MB)
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

// Set up multer for handling img uploading along with assignments
const str = multer.memoryStorage(); // Store the uploaded file in memory
const assignmentUpload = multer({ storage: str }); 


// Set up Multer for handling file uploads with filter and limits
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/videos/'); // Store video files in the "videos" directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['video/mp4'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4 files are allowed!'), false);
  }
};

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // Limit file size to 1GB      
  },
});

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images/');
  },
  filename : (req , file , cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname);
    cb(null, "image-"  + uniqueSuffix + extname);
  }
})

const imageFileFilter = (req , file , cb) => {
  const allowedMimeTypes = ['image/png' , 'image/jpg' , 'image/jpeg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG files are allowed!'), false);
  }
}

const imageLimits = {
  fileSize: 1024 * 1024 * 5, //5MB
};

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: imageLimits
})

const TestUpload = multer({
  storage : imageStorage,
  fileFilter : imageFileFilter,
  limits : imageLimits
}).single('questionDataImg');

router.route('/').get(home);
router.route('/alljoinrequest').get(getAllJoinRequests);

// Notifications
router.route('/fetch/recent-notifications').get(fetchNotifications);  // /fetch/recent-notifications?currentTime=MM/DD/YYYY%20hh:mm:ss

// Student Database to access students information
router.route('/studentdatabase').get(fetchAllClassMetaData);
router.route('/:classid/studentlist').get(fetchStudentList);    
router.route('/studentDatabase/:email/profile').get(fetchStudentProfile);    

// Routes to handle Announcements 
router.route('/:classid/announcements/post').post(postAnnouncement);
router.route('/announcements/fetchall').get(fetchAllAnnouncements);   
router.route('/announcements/fetch').get(fetchAnnouncements);  
      

router.route('/profile').get(userProfile)   
router.route('/profile/updateprofile').post(updateProfile)             

router.route('/:classid/fetch-classroom-data').get(fetchClassroom)
router.route('/createclassroom').post(createClassroom);
router.route('/deleteclassroom').delete(deleteClassRoom);

// temporary route    
router.route('/:chapterid/addchapter').get(allowChapterExcess);   
router.route('/:classid/curriculum').get(fetchCurriculum)
router.route('/:classid/addChapter').post(addChapter)
router.route('/:classId/chapters/:chapterId').post(addTopic)
router.route('/:classid/curriculum/:chapterid/:topicid').post(imageUpload.single('file'), addExtractedQuestions);

router.route("/:classid/curriculum/:chapterid/:topicid").get(fetchExtractedQuestions) 
router.route("/:classid/curriculum/:chapterid/:topicid/delete").delete(deleteTopic)
router.route("/:classid/curriculum/:chapterid/delete").delete(deleteChapter)

router.route('/:classId/addstudent').get(generateLinkforJoiningClass);  
router.route('/:classId/joinclassroom').get(joinClassroom);
router.route('/:classId/getclassroomtojoin').get(getclasstojoin)   
router.route('/:classId/handlejoinrequest').post(handlejoinrequest);
router.route('/:classId/leaveclassroom').get(LeaveClassroom);
router.route('/:classId/removestudent/:email').get(RemoveStudentfromClassroom);


    
       
// fetching assignments
router.route('/:classid/assignment/fetchallassignments').get(fetchAllAssignments);
router.route('/:classid/assignment/:assignmentid/assignmentresponse').get(assignmentResponse) 
router.route('/:classid/assignment/:assignmentid/deleteassignment').delete(deleteAssignment);     

// Handle Test routes
router.route('/:classid/test/:chapterid/addtest').post(imageUpload.array('questionDataImg'), addTestToClassroom); 
router.route('/:classid/test/fetchalltests').get(fetchAllTests);
router.route('/:classid/test/:testid').get(getTest);
router.route('/:classid/test/:testid/submitresponse/:draft?').post(submitTestResponse);
router.route('/:classid/test/:testId/clearresponse').post(clearTestResponse);
router.route('/:classid/test/:testid/markforreview/:draft?').post(markforReviewTest);
router.route('/:classid/test/:testid/submit/:draft?').post(submitStudentTest); 
router.route("/:classid/test/:testid/result").get(getStudentResult);
router.route("/:classid/test/:testid/result/teacher").get(getResultForTeacher);  
router.route('/:classid/test/:testid/testmetadata').get(testMetaData);
router.route('/:classid/test/:chapterID/questions').get(FetchQuestionsByChapter);
router.route('/:classid/test/:chapterID/alltopics').get(FetchTopicInsideChapter);
// delete test route 
router.route('/:classid/:chapterid/test/:testid/deletetest').delete(deleteTest);  

router.route('/:classid/assignment/addassignment').post( assignmentUpload.array('questionDataImg'),addAssignmentToClassroom);   
router.route('/:classid/assignment/:assignmentid').get(getAssignment);
router.route('/:classid/assignment/:assignmentid/submit/:draft?').post(submitAssignment);      
router.route('/:classid/assignment/:assignmentid/submitresponse/:draft?').post(submitResponse);   
router.route('/:classid/assignment/:assignmentid/markforreview/:draft?').post(markforReview);    
router.route('/:classid/assignment/:assignmentid/clearresponse').post(clearResponse); 


  
// Notes  
router.post('/:classid/note/:chapterid/addnote', upload.single('uploadedFile'), uploadFile);     
// router.get('/:classid/notes',fileData);  
router.get('/:classid/download/:filename', downloadFile);
router.delete('/:classid/note/deletenote',deleteNote)

// Videos    
router.post('/:classid/video/:chapterid/addvideo', videoUpload.single('uploadVideo'), uploadVideo);                      
router.get('/:classid/videos',videoFileData);
router.delete('/:classid/video/deletevideo',deleteVideo)

//dashboard
router.get('/:classid/dashboard',getData);


const { UserData } = require("../controllers/studentDatabase");
//Get User Data
router.get("/getUserData",UserData);

module.exports = router;