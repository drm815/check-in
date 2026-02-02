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

    if (action === "getAttendance") {
        return getAttendance();
    }

    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
}

function getAttendance() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var records = data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, j) {
            var key = header.toLowerCase().replace(" ", "");
            obj[key] = row[j];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(records))
        .setMimeType(ContentService.MimeType.JSON);
}

function updateReportStatus(id, status) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No data" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
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
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Students");
        sheet.appendRow(["ID", "Name", "ParentEmail", "Password"]);
    }

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();

    var passIdx = headers.indexOf("Password");
    if (passIdx === -1) {
        sheet.getRange(1, headers.length + 1).setValue("Password");
        headers.push("Password");
        passIdx = headers.length - 1;
    }

    var students = data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, i) {
            var key = header.toString().trim().toLowerCase();
            var val = row[i];
            if (key === "id") val = val.toString().trim();
            obj[key] = val;
        });
        if (!obj.password) obj.password = obj.id;
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(students))
        .setMimeType(ContentService.MimeType.JSON);
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

function changePassword(studentId, newPassword) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var passIdx = headers.indexOf("Password");

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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Topics");
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Topics");
        sheet.appendRow(["Topic"]);
        sheet.appendRow(["수업 시간 활동", "청소 및 봉사", "자율 활동"]);
    }

    var data = sheet.getDataRange().getValues();
    data.shift();
    var topics = data.map(function (row) { return row[0]; });

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
