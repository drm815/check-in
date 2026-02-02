/**
 * Google Apps Script for the School Life App
 * Attach this to your Google Sheet (Extensions > Apps Script)
 */

function doGet(e) {
    var action = e.parameter.action;

    if (action === "setup") {
        return setup();
    }

    if (action === "getStudents") {
        return getStudents();
    }

    if (action === "getReport") {
        return getReport(e.parameter.id);
    }

    if (action === "updateReportStatus") {
        return updateReportStatus(e.parameter.id, e.parameter.status);
    }

    if (action === "getTopics") {
        return getTopics();
    }

    if (action === "getAttendance") {
        return getAttendance();
    }

    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
}

function getAttendance() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var records = data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, j) {
            var key = header.toString().toLowerCase().replace(/\s/g, "");
            obj[key] = row[j];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(records))
        .setMimeType(ContentService.MimeType.JSON);
}

function updateReportStatus(id, status) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No sheet" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][1].toString().trim() === id.toString().trim()) {
            sheet.getRange(i + 1, 6).setValue(status);
            return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ error: "Report not found" })).setMimeType(ContentService.MimeType.JSON);
}

function getReport(id) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No data" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var report = null;
    for (var i = 0; i < data.length; i++) {
        if (data[i][1].toString().trim() === id.toString().trim()) {
            report = {};
            headers.forEach(function (header, j) {
                report[header.toString().toLowerCase().replace(/\s/g, "")] = data[i][j];
            });
            break;
        }
    }
    return ContentService.createTextOutput(JSON.stringify(report))
        .setMimeType(ContentService.MimeType.JSON);
}

function getStudents() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students");
    if (!sheet) {
        sheet = ss.insertSheet("Students");
        sheet.appendRow(["ID", "Name", "ParentEmail", "Password"]);
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().trim(); });
    var passIdx = -1;
    for (var i = 0; i < headers.length; i++) {
        if (headers[i].toLowerCase() === "password") {
            passIdx = i;
            break;
        }
    }

    var students = [];
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[0] || row[0] === "") continue;

        var obj = {};
        headers.forEach(function (header, j) {
            var key = header.toLowerCase();
            var val = row[j];
            if (key === "id") val = val.toString().trim();
            obj[key] = val;
        });

        // Default password logic: if column missing or cell empty, use ID
        if (passIdx === -1 || !row[passIdx] || row[passIdx] === "") {
            obj.password = obj.id;
        } else {
            obj.password = row[passIdx].toString().trim();
        }
        students.push(obj);
    }

    return ContentService.createTextOutput(JSON.stringify(students))
        .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Students Sheet
    var studentSheet = ss.getSheetByName("Students");
    if (!studentSheet) {
        studentSheet = ss.insertSheet("Students");
        studentSheet.appendRow(["ID", "Name", "ParentEmail", "Password"]);
        studentSheet.appendRow(["20301", "홍길동", "parent@example.com", "20301"]);
    } else {
        var data = studentSheet.getDataRange().getValues();
        var headers = data[0].map(function (h) { return h.toString().toLowerCase(); });
        if (headers.indexOf("password") === -1) {
            studentSheet.getRange(1, headers.length + 1).setValue("Password");
        }
    }

    // 2. Attendance Sheet
    if (!ss.getSheetByName("Attendance")) {
        var attendSheet = ss.insertSheet("Attendance");
        attendSheet.appendRow(["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"]);
    }

    // 3. Topics Sheet
    if (!ss.getSheetByName("Topics")) {
        var topicSheet = ss.insertSheet("Topics");
        topicSheet.appendRow(["Topic"]);
        topicSheet.appendRow(["수업 시간 활동"]);
        topicSheet.appendRow(["청소 및 봉사"]);
        topicSheet.appendRow(["자율 활동"]);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput("설치가 완료되었습니다! 시트와 로그인을 확인해 보세요.")
        .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "uploadPhotos") {
        return handlePhotoUpload(data);
    }

    if (action === "changePassword") {
        return changePassword(data.studentId, data.newPassword);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.insertSheet("Attendance");
        sheet.appendRow(["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"]);
    }

    sheet.appendRow([
        new Date(),
        data.reportId,
        data.studentId,
        data.name,
        data.type,
        data.status,
        data.reason || ""
    ]);

    if (data.status === "PENDING" && data.parentEmail) {
        sendParentNotification(data.parentEmail, data.name, data.type, data.reportId);
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function changePassword(studentId, newPassword) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Students sheet missing" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase(); });
    var passIdx = headers.indexOf("password");

    if (passIdx === -1) {
        sheet.getRange(1, headers.length + 1).setValue("Password");
        passIdx = headers.length;
    }

    for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === studentId.toString().trim()) {
            sheet.getRange(i + 1, passIdx + 1).setValue(newPassword);
            return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Student not found" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function getTopics() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Topics");
    if (!sheet) {
        sheet = ss.insertSheet("Topics");
        sheet.appendRow(["Topic"]);
        sheet.appendRow(["수업 시간 활동"]);
        sheet.appendRow(["청소 및 봉사"]);
        sheet.appendRow(["자율 활동"]);
    }

    var data = sheet.getDataRange().getValues();
    data.shift();
    var topics = data.map(function (row) { return row[0]; }).filter(function (t) { return t !== ""; });

    var rootFolderName = "K-Mates_Uploads";
    var rootFolder;
    var folders = DriveApp.getFoldersByName(rootFolderName);
    if (folders.hasNext()) {
        rootFolder = folders.next();
    } else {
        rootFolder = DriveApp.createFolder(rootFolderName);
    }

    topics.forEach(function (topic) {
        if (topic && !rootFolder.getFoldersByName(topic).hasNext()) {
            rootFolder.createFolder(topic);
        }
    });

    return ContentService.createTextOutput(JSON.stringify(topics))
        .setMimeType(ContentService.MimeType.JSON);
}

function handlePhotoUpload(data) {
    var rootFolder;
    var folders = DriveApp.getFoldersByName("K-Mates_Uploads");
    rootFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder("K-Mates_Uploads");

    var topicFolder;
    var topicFolders = rootFolder.getFoldersByName(data.topic);
    topicFolder = topicFolders.hasNext() ? topicFolders.next() : rootFolder.createFolder(data.topic);

    var today = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    data.images.forEach(function (img, index) {
        var base64Data = img.base64.split(",")[1];
        var decoded = Utilities.base64Decode(base64Data);
        var fileName = today + "_" + data.name + "_" + (index + 1) + ".jpg";
        var blob = Utilities.newBlob(decoded, "image/jpeg", fileName);
        topicFolder.createFile(blob);
    });

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function sendParentNotification(parentEmail, studentName, reason, reportId) {
    var appUrl = "https://check-in-final.vercel.app";
    var verifyUrl = appUrl + "/verify/" + reportId;
    var subject = "[K-Mates] " + studentName + " 학부모 확인 요청 (" + reason + ")";
    var body = studentName + " 학생의 " + reason + " 신고가 접수되었습니다.\n\n" +
        "사유: " + (reason || "사유 없음") + "\n\n" +
        "위 내용이 맞다면 아래 확인 링크를 클릭해 주세요:\n" +
        verifyUrl + "\n\n" +
        "* 본 메일은 학교 출결 시스템에서 자동 발송되었습니다.";

    try {
        GmailApp.sendEmail(parentEmail, subject, body);
    } catch (e) {
        console.error("Failed to send email: " + e.toString());
    }
}
