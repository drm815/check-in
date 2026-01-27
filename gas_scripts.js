/**
 * Google Apps Script for the School Life App
 * Attach this to your Google Sheet (Extensions > Apps Script)
 */

function doGet(e) {
    var action = e.parameter.action;

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

    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
}

function updateReportStatus(id, status) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No sheet" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    // Report ID is in the column index 1 (2nd column)
    for (var i = 1; i < data.length; i++) {
        if (data[i][1].toString().trim() === id.toString().trim()) {
            sheet.getRange(i + 1, 6).setValue(status); // Status is in the 6th column
            return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ error: "Report not found" })).setMimeType(ContentService.MimeType.JSON);
}

function getReport(id) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No data" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();

    // Find row with matching ID (reportId)
    var report = null;
    for (var i = 0; i < data.length; i++) {
        if (data[i][1].toString().trim() === id.toString().trim()) {
            report = {};
            headers.forEach(function (header, j) {
                report[header.toLowerCase().replace(" ", "")] = data[i][j];
            });
            break;
        }
    }

    return ContentService.createTextOutput(JSON.stringify(report))
        .setMimeType(ContentService.MimeType.JSON);
}

function getStudents() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students");
    if (!sheet) {
        // Create default sheet if doesn't exist
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Students");
        sheet.appendRow(["ID", "Name", "ParentEmail"]);
    }

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var students = data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, i) {
            var key = header.toString().trim().toLowerCase();
            var val = row[i];
            if (key === "id") val = val.toString().trim();
            obj[key] = val;
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(students))
        .setMimeType(ContentService.MimeType.JSON);
}

function getTopics() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Topics");
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Topics");
        sheet.appendRow(["Topic"]);
        sheet.appendRow(["수업 시간 활동"]);
        sheet.appendRow(["청소 및 봉사"]);
        sheet.appendRow(["자율 활동"]);
    }

    var data = sheet.getDataRange().getValues();
    data.shift(); // Remove header
    var topics = data.map(function (row) { return row[0]; });

    // Ensure folders exist for each topic
    var rootFolderName = "K-Mates_Uploads";
    var rootFolder;
    var folders = DriveApp.getFoldersByName(rootFolderName);
    if (folders.hasNext()) {
        rootFolder = folders.next();
    } else {
        rootFolder = DriveApp.createFolder(rootFolderName);
    }

    topics.forEach(function (topic) {
        if (topic) {
            var topicFolders = rootFolder.getFoldersByName(topic);
            if (!topicFolders.hasNext()) {
                rootFolder.createFolder(topic);
            }
        }
    });

    return ContentService.createTextOutput(JSON.stringify(topics))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "uploadPhotos") {
        return handlePhotoUpload(data);
    }

    // Default: Attendance/Report logic
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Attendance");
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

function handlePhotoUpload(data) {
    var studentName = data.name;
    var topic = data.topic;
    var images = data.images; // Array of { name: string, base64: string }

    var rootFolderName = "K-Mates_Uploads";
    var rootFolder;
    var folders = DriveApp.getFoldersByName(rootFolderName);
    if (folders.hasNext()) {
        rootFolder = folders.next();
    } else {
        rootFolder = DriveApp.createFolder(rootFolderName);
    }

    // 1. Find or create Topic subfolder
    var topicFolder;
    var topicFolders = rootFolder.getFoldersByName(topic);
    if (topicFolders.hasNext()) {
        topicFolder = topicFolders.next();
    } else {
        topicFolder = rootFolder.createFolder(topic);
    }

    var today = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");

    // 2. Upload images inside Topic folder with Date_Name filename
    images.forEach(function (img, index) {
        var base64Data = img.base64.split(",")[1];
        var decoded = Utilities.base64Decode(base64Data);
        var fileName = today + "_" + studentName + "_" + (index + 1) + ".jpg";
        var blob = Utilities.newBlob(decoded, "image/jpeg", fileName);
        topicFolder.createFile(blob);
    });

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function sendParentNotification(parentEmail, studentName, reason, reportId) {
    // For testing: http://localhost:3000
    // For production: https://your-app-name.vercel.app
    var appUrl = "http://localhost:3000";
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
