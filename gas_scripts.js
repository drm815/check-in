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

    // Mapping for English and Korean headers to standard keys
    var keyMap = {
        "timestamp": "timestamp", "시각": "timestamp", "타임스탬프": "timestamp",
        "reportid": "reportid", "신고id": "reportid", "신고 id": "reportid",
        "studentid": "studentid", "학번": "studentid", "학생id": "studentid",
        "name": "name", "이름": "name",
        "type": "type", "유형": "type", "구분": "type",
        "status": "status", "상태": "status", "승인여부": "status",
        "reason": "reason", "사유": "reason", "비고": "reason"
    };

    var records = data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, j) {
            var rawHeader = header.toString().trim().toLowerCase().replace(/\s/g, "");
            var standardKey = keyMap[rawHeader] || rawHeader;
            obj[standardKey] = row[j];
        });

        // HEURISTIC FIX: If data is shifted (e.g., studentId contains a report ID)
        // Detect if studentid looks like an auto-generated ID (short random chars) vs academic ID (numbers)
        if (obj.studentid && obj.studentid.length < 12 && isNaN(Number(obj.studentid))) {
            // Likely shifted. Let's re-map if looks like typical shift observed:
            // Original: Timestamp, ReportID, StudentID, Name, Type, Status, Reason
            // Current Observed Shift: Timestamp, [ReportID as StudentID], [StudentID as Name], [Name as Type], [Type as Status], [Status as Reason]
            if (obj.status && (obj.status === "결석" || obj.status === "지각" || obj.status === "조퇴")) {
                var realStatus = obj.reason;
                var realReason = row[6] || ""; // The actual reason col
                var realType = obj.status;
                var realName = obj.type;
                var realStudentId = obj.name;
                var realReportId = obj.studentid;

                obj.reportid = realReportId;
                obj.studentid = realStudentId;
                obj.name = realName;
                obj.type = realType;
                obj.status = realStatus;
                obj.reason = realReason;
            }
        }

        return obj;
    }).filter(function (r) { return r.timestamp && r.timestamp !== ""; });

    return ContentService.createTextOutput(JSON.stringify(records))
        .setMimeType(ContentService.MimeType.JSON);
}

function updateReportStatus(id, status) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "No sheet" })).setMimeType(ContentService.MimeType.JSON);

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase().replace(/\s/g, ""); });

    // Key mapped indexes
    var idIdx = -1;
    var statusIdx = -1;
    for (var j = 0; j < headers.length; j++) {
        var raw = headers[j];
        if (raw === "reportid" || raw === "신고id" || raw === "신고 id") idIdx = j;
        if (raw === "status" || raw === "상태" || raw === "승인여부") statusIdx = j;
    }

    // Still check studentid col in case of shift
    var studentIdIdx = headers.indexOf("studentid") || headers.indexOf("학번");

    for (var i = 1; i < data.length; i++) {
        // Try precise match on ID col
        if (idIdx !== -1 && data[i][idIdx].toString().trim() === id.toString().trim()) {
            sheet.getRange(i + 1, statusIdx + 1).setValue(status);
            return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
        // Try fallback match on StudentID col (in case of shift)
        if (studentIdIdx !== -1 && data[i][studentIdIdx].toString().trim() === id.toString().trim()) {
            // Find status col (in shifted logic it's often the Reason col index)
            var targetCol = (statusIdx !== -1) ? (statusIdx + 1) : 6;
            sheet.getRange(i + 1, targetCol).setValue(status);
            return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ error: "Report not found" })).setMimeType(ContentService.MimeType.JSON);
}

function getReport(id) {
    var records = JSON.parse(getAttendance().getContent());
    var report = records.find(function (r) { return r.reportid === id || r.studentid === id; });
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

    var students = [];
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[0] || row[0] === "") continue;

        var obj = {};
        headers.forEach(function (header, j) {
            var raw = header.toLowerCase().replace(/\s/g, "");
            var key = (raw === "id" || raw === "학번") ? "id" :
                (raw === "name" || raw === "이름") ? "name" :
                    (raw === "parentemail" || raw === "학부모이메일") ? "parentemail" :
                        (raw === "password" || raw === "비밀번호") ? "password" : raw;
            var val = row[j];
            if (key === "id") val = val.toString().trim();
            obj[key] = val;
        });

        if (!obj.password || obj.password === "") {
            obj.password = obj.id;
        }
        students.push(obj);
    }

    return ContentService.createTextOutput(JSON.stringify(students))
        .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Attendance Sheet - Ensure correct headers
    var attendSheet = ss.getSheetByName("Attendance");
    var correctHeaders = ["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"];
    if (!attendSheet) {
        attendSheet = ss.insertSheet("Attendance");
        attendSheet.appendRow(correctHeaders);
    } else {
        var currentHeaders = attendSheet.getRange(1, 1, 1, attendSheet.getLastColumn()).getValues()[0];
        if (currentHeaders.length < 7 || currentHeaders.indexOf("Report ID") === -1) {
            // Fix: Insert Report ID column at index 2 if missing
            attendSheet.insertColumnAfter(1);
            attendSheet.getRange(1, 2).setValue("Report ID");
            SpreadsheetApp.flush();
        }
    }

    // 2. Students Sheet
    var studentSheet = ss.getSheetByName("Students");
    if (!studentSheet) {
        studentSheet = ss.insertSheet("Students");
        studentSheet.appendRow(["ID", "Name", "ParentEmail", "Password"]);
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
    return ContentService.createTextOutput("설치가 완료되었습니다! 시트 구조가 자동 교정되었습니다.").setMimeType(ContentService.MimeType.TEXT);
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
        data.status, // Expecting 'PENDING' for reports
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
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase().replace(/\s/g, ""); });
    var passIdx = -1;
    for (var j = 0; j < headers.length; j++) {
        if (headers[j] === "password" || headers[j] === "비밀번호") { passIdx = j; break; }
    }

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
        sheet.appendRow(["수업 시간 활동", "청소 및 봉사", "자율 활동"]);
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
