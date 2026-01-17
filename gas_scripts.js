/**
 * Google Apps Script for the School Life App
 * Attach this to your Google Sheet (Extensions > Apps Script)
 */

function doGet(e) {
    var action = e.parameter.action;

    if (action === "getStudents") {
        return getStudents();
    }

    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
}

function getStudents() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Students");
    if (!sheet) {
        // Create default sheet if doesn't exist
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Students");
        sheet.appendRow(["ID", "Name", "ParentPhone"]);
        sheet.appendRow(["001", "강한별", "01011112222"]);
        sheet.appendRow(["002", "김민재", "01033334444"]);
    }

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var students = data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, i) {
            obj[header.toLowerCase()] = row[i];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(students))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");

    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Attendance");
        sheet.appendRow(["Timestamp", "Student ID", "Name", "Type", "Status", "Reason"]);
    }

    sheet.appendRow([
        new Date(),
        data.id,
        data.name,
        data.type,
        data.status,
        data.reason || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function sendParentNotification(parentPhone, studentName, reason, reportId) {
    // Example using a fictional SMS API or Gmail
    var verifyUrl = "https://your-app-domain.com/verify/" + reportId;
    var message = "[K-Mates] " + studentName + " 서의 " + reason + " 신고가 접수되었습니다. 확인을 위해 링크를 눌러주세요: " + verifyUrl;

    // GmailApp.sendEmail(parentEmail, "[K-Mates] 학부모 확인 요청", message);
    // Or fetch to Aligo/Coolsms API
}
