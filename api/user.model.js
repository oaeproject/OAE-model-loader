var general = require("./general.js");

/////////////////////
// USER PARAMETERS //
/////////////////////

var DISTRIBUTIONS = {
    "student": {
        "SEX": [[0.5, "M"],[0.5, "F"]],
        "REORDERED_PUBPRIVSPACE": [[0.9, false],[0.1, true]],
        "USER_ACCOUNT_PRIVACY": [[0.7, "public"], [0.3, "loggedin"]],
        "HAS_BASIC_INFO_SECTION": [[0.7, true],[0.3, false]],
        "HAS_EMAIL": [[0.9, true], [0.1, false]],
        "HAS_PREFERRED_NAME": [[0.15, true], [0.85, false]],
        "HAS_DEPARTMENT": [[0.8, true], [0.2, false]],
        "HAS_COLLEGE": [[0.5, true], [0.5, false]],
        "HAS_TAGS": [[0.25, true], [0.75, false]],
        "TAGS": [2, 1, 1, 10],
        "HAS_DIRECTORY": [[0.3, true], [0.7, false]],
        "DIRECTORY": [3, 2, 1, 20],
        "HAS_ABOUT_ME_SECTION": [[0.4, true],[0.6, false]],
        "ABOUT_ME_PRIVACY": [[0.4, "public"], [0.25, "loggedin"], [0.25, "contacts"], [0.10, "private"]],
        "HAS_ABOUT_ME": [[0.7, true], [0.3, false]],
        "ABOUT_ME": [2, 2, 1, 25],
        "HAS_ACADEMIC_INTERESTS": [[0.6, true], [0.4, false]],
        "ACADEMIC_INTERESTS": [2, 2, 1, 50],
        "HAS_PERSONAL_INTERESTS": [[0.6, true], [0.4, false]],
        "PERSONAL_INTERESTS": [3, 2, 1, 50],
        "HAS_HOBBIES": [[0.5, true], [0.5, false]],
        "HOBBIES": [3, 2, 1, 50],
        "PUBLICATIONS_PRIVACY": [[0.8, "public"], [0.1, "everyone"], [0.09, "contacts"], [0.01, "private"]],
        "PUBLICATIONS": [1, 3, 0, 20],
        "HAS_PICTURE": [[0.8, true], [0.2, false]],
        "WORLDS_WEIGHTING": [[0.3, 1], [0.5, 3], [0.2, 5]]
    },
    "lecturer": {
        "SEX": [[0.5, "M"],[0.5, "F"]],
        "REORDERED_PUBPRIVSPACE": [[0.85, false],[0.15, true]],
        "USER_ACCOUNT_PRIVACY": [[0.4, "public"], [0.6, "loggedin"]],
        "HAS_BASIC_INFO_SECTION": [[0.7, true],[0.3, false]],
        "HAS_EMAIL": [[0.7, true], [0.3, false]],
        "HAS_PREFERRED_NAME": [[0.05, true], [0.95, false]],
        "HAS_DEPARTMENT": [[0.7, true], [0.3, false]],
        "HAS_COLLEGE": [[0.3, true], [0.7, false]],
        "HAS_TAGS": [[0.1, true], [0.9, false]],
        "TAGS": [2, 1, 1, 10],
        "HAS_DIRECTORY": [[0.2, true], [0.8, false]],
        "DIRECTORY": [3, 2, 1, 20],
        "HAS_ABOUT_ME_SECTION": [[0.4, true],[0.6, false]],
        "ABOUT_ME_PRIVACY": [[0.2, "public"], [0.25, "loggedin"], [0.15, "contacts"], [0.40, "private"]],
        "HAS_ABOUT_ME": [[0.5, true], [0.5, false]],
        "ABOUT_ME": [2, 2, 1, 25],
        "HAS_ACADEMIC_INTERESTS": [[0.6, true], [0.4, false]],
        "ACADEMIC_INTERESTS": [2, 2, 1, 50],
        "HAS_PERSONAL_INTERESTS": [[0.3, true], [0.7, false]],
        "PERSONAL_INTERESTS": [3, 2, 1, 25],
        "HAS_HOBBIES": [[0.25, true], [0.75, false]],
        "HOBBIES": [3, 2, 1, 20],
        "PUBLICATIONS_PRIVACY": [[0.6, "public"], [0.25, "loggedin"], [0.10, "contacts"], [0.05, "private"]],
        "PUBLICATIONS": [3, 3, 0, 50],
        "HAS_PICTURE": [[0.5, true], [0.5, false]],
        "WORLDS_WEIGHTING": [[0.4, 1], [0.4, 3], [0.2, 5]]
    },
    "researcher": {
        "SEX": [[0.5, "M"],[0.5, "F"]],
        "REORDERED_PUBPRIVSPACE": [[0.85, false],[0.15, true]],
        "USER_ACCOUNT_PRIVACY": [[0.7, "public"], [0.3, "loggedin"]],
        "HAS_BASIC_INFO_SECTION": [[0.7, true],[0.3, false]],
        "HAS_EMAIL": [[0.8, true], [0.2, false]],
        "HAS_PREFERRED_NAME": [[0.05, true], [0.95, false]],
        "HAS_DEPARTMENT": [[0.7, true], [0.3, false]],
        "HAS_COLLEGE": [[0.3, true], [0.7, false]],
        "HAS_TAGS": [[0.3, true], [0.7, false]],
        "HAS_DIRECTORY": [[0.4, true], [0.6, false]],
        "DIRECTORY": [3, 2, 1, 20],
        "TAGS": [2, 1, 1, 10],
        "HAS_ABOUT_ME_SECTION": [[0.4, true],[0.6, false]],
        "ABOUT_ME_PRIVACY": [[0.6, "public"], [0.25, "loggedin"], [0.10, "contacts"], [0.05, "private"]],
        "HAS_ABOUT_ME": [[0.7, true], [0.3, false]],
        "ABOUT_ME": [2, 2, 1, 25],
        "HAS_ACADEMIC_INTERESTS": [[0.8, true], [0.2, false]],
        "ACADEMIC_INTERESTS": [5, 3, 1, 50],
        "HAS_PERSONAL_INTERESTS": [[0.5, true], [0.5, false]],
        "PERSONAL_INTERESTS": [3, 2, 1, 25],
        "HAS_HOBBIES": [[0.4, true], [0.6, false]],
        "HOBBIES": [3, 2, 1, 30],
        "PUBLICATIONS_PRIVACY": [[0.9, "public"], [0.05, "loggedin"], [0.03, "contacts"], [0.02, "private"]],
        "PUBLICATIONS": [10, 6, 0, 100],
        "HAS_PICTURE": [[0.7, true], [0.3, false]],
        "WORLDS_WEIGHTING": [[0.2, 1], [0.5, 3], [0.3, 5]]
    }
}


////////////////
// USER MODEL //
////////////////

exports.User = function(batchid) {
    var that = {};

    that.userType = general.randomize([[0.6, "student"],[0.1, "lecturer"],[0.3, "researcher"]]);

    that.sex = general.randomize(DISTRIBUTIONS[that.userType].SEX);
    that.firstName = general.generateFirstName(that.sex);
    that.lastName = general.generateLastName();
    that.userid = general.generateId(batchid, [that.firstName, that.lastName]);
    that.password = general.generatePassword();

    that.reordersPubprivspace = general.randomize(DISTRIBUTIONS[that.userType].REORDERED_PUBPRIVSPACE);
    that.userAccountPrivacy = general.randomize(DISTRIBUTIONS[that.userType].USER_ACCOUNT_PRIVACY);

    that.basicInfo = {
        hasBasicInfoSection: general.randomize(DISTRIBUTIONS[that.userType].HAS_BASIC_INFO_SECTION),
        hasEmail: general.randomize(DISTRIBUTIONS[that.userType].HAS_EMAIL),
        email: general.generateEmail([that.firstName, that.lastName]),
        hasPreferredName: general.randomize(DISTRIBUTIONS[that.userType].HAS_PREFERRED_NAME),
        preferredName: general.generateName(that.sex),
        hasDepartment: general.randomize(DISTRIBUTIONS[that.userType].HAS_DEPARTMENT),
        department: general.generateDepartment(),
        hasCollege: general.randomize(DISTRIBUTIONS[that.userType].HAS_COLLEGE),
        college: general.generateCollege(),
        hasTags: general.randomize(DISTRIBUTIONS[that.userType].HAS_TAGS),
        tags: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].TAGS)),
        hasDirectory: general.randomize(DISTRIBUTIONS[that.userType].HAS_DIRECTORY),
        directory: general.generateDirectory(general.ASM(DISTRIBUTIONS[that.userType].DIRECTORY))
    }

    that.aboutMe = {
        hasAboutMeSection: general.randomize(DISTRIBUTIONS[that.userType].HAS_ABOUT_ME_SECTION),
        aboutMePrivacy: general.randomize(DISTRIBUTIONS[that.userType].ABOUT_ME_PRIVACY),
        hasAboutMe: general.randomize(DISTRIBUTIONS[that.userType].HAS_ABOUT_ME),
        aboutMe: general.generateSentence(general.ASM(DISTRIBUTIONS[that.userType].ABOUT_ME)),
        hasAcademicInterests: general.randomize(DISTRIBUTIONS[that.userType].HAS_ACADEMIC_INTERESTS),
        academicInterests: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].ACADEMIC_INTERESTS)),
        hasPersonalInterests: general.randomize(DISTRIBUTIONS[that.userType].HAS_PERSONAL_INTERESTS),
        personalInterests: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].PERSONAL_INTERESTS)),
        hasHobbies: general.randomize(DISTRIBUTIONS[that.userType].HAS_HOBBIES),
        hobbies: general.generateKeywords(general.ASM(DISTRIBUTIONS[that.userType].HOBBIES))
    }

    var publications = [];
    var numberOfPublications = general.ASM(DISTRIBUTIONS[that.userType].PUBLICATIONS);
    for (var p = 0; p < numberOfPublications; p++){
        publications.push(new exports.Publication(that));
    }
    that.publications = {
        publicationsPrivacy: general.randomize(DISTRIBUTIONS[that.userType].PUBLICATIONS_PRIVACY),
        publications: publications
    }

    that.picture = {
        hasPicture: general.randomize(DISTRIBUTIONS[that.userType].HAS_PICTURE),
        picture: general.generatePersonPicture()
    }

    that.worldWeighting = general.randomize(DISTRIBUTIONS[that.userType].WORLDS_WEIGHTING);
    that.contentWeighting = 0;

    return that;
}

exports.Publication = function(user){
    var that = {};

    that.title = general.generateSentence(1);
    that.mainAuthor = user.lastName + " " + user.firstName.substring(0, 1) + ".";
    that.publisher = general.generateCity() + " Press";
    that.placeofpublication = general.generateCity();
    that.year = general.ASM([2005, 15, 1990, 2012]);

    return that;
}