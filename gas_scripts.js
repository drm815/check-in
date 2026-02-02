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
        return jsonResponse(getReportData(e.parameter.id));
    }

    if (action === "updateReportStatus") {
        return updateReportStatus(e.parameter.id, e.parameter.status);
    }

    if (action === "getTopics") {
        return getTopics();
    }

    if (action === "getAttendance") {
        return jsonResponse(getAttendanceData());
    }

    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function getAttendanceData() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();

    var keyMap = {
        "timestamp": "timestamp", "시각": "timestamp", "타임스탬프": "timestamp",
        "reportid": "reportid", "신고id": "reportid", "신고 id": "reportid",
        "studentid": "studentid", "학번": "studentid", "학생id": "studentid",
        "name": "name", "이름": "name",
        "type": "type", "유형": "type", "구분": "type",
        "status": "status", "상태": "status", "승인여부": "status",
        "reason": "reason", "사유": "reason", "비고": "reason"
    };

    return data.map(function (row) {
        var obj = {};
        headers.forEach(function (header, j) {
            var rawHeader = header.toString().trim().toLowerCase().replace(/\s/g, "");
            var standardKey = keyMap[rawHeader] || rawHeader;
            obj[standardKey] = row[j];
        });

        // HEURISTIC FIX for shifted columns
        if (obj.studentid && obj.studentid.length < 12 && isNaN(Number(obj.studentid))) {
            if (obj.status && (obj.status === "결석" || obj.status === "지각" || obj.status === "조퇴")) {
                var realStatus = obj.reason;
                var realReason = row[6] || "";
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
}

function getReportData(id) {
    var records = getAttendanceData();
    // Search by both reportid and studentid (fallback for shifted data)
    return records.find(function (r) {
        return (r.reportid && r.reportid.toString().trim() === id.toString().trim()) ||
            (r.studentid && r.studentid.toString().trim() === id.toString().trim());
    }) || { error: "Not found" };
}

function updateReportStatus(id, status) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return jsonResponse({ error: "No sheet" });

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase().replace(/\s/g, ""); });

    var idIdx = -1;
    var statusIdx = -1;
    var studentIdIdx = -1;

    for (var j = 0; j < headers.length; j++) {
        var raw = headers[j];
        if (raw === "reportid" || raw === "신고id") idIdx = j;
        if (raw === "status" || raw === "상태") statusIdx = j;
        if (raw === "studentid" || raw === "학번") studentIdIdx = j;
    }

    for (var i = 1; i < data.length; i++) {
        // Match by Report ID
        if (idIdx !== -1 && data[i][idIdx].toString().trim() === id.toString().trim()) {
            var col = statusIdx !== -1 ? statusIdx + 1 : 6;
            sheet.getRange(i + 1, col).setValue(status);
            return jsonResponse({ result: "success" });
        }
        // Fallback: Match by Student ID (if data is shifted)
        if (studentIdIdx !== -1 && data[i][studentIdIdx].toString().trim() === id.toString().trim()) {
            // In shifted data, Status is usually col 6 (Reason/Status area)
            var col = statusIdx !== -1 ? statusIdx + 1 : 6;
            sheet.getRange(i + 1, col).setValue(status);
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ error: "Report not found" });
}

function getStudents() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students");
    if (!sheet) {
        setup();
        return jsonResponse([]);
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
    return jsonResponse(students);
}

function setup() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var attendSheet = ss.getSheetByName("Attendance");
    var headers = ["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"];
    if (!attendSheet) {
        attendSheet = ss.insertSheet("Attendance");
        attendSheet.appendRow(headers);
    } else {
        var firstRow = attendSheet.getRange(1, 1, 1, attendSheet.getLastColumn()).getValues()[0];
        if (firstRow.indexOf("Report ID") === -1) {
            attendSheet.insertColumnAfter(1);
            attendSheet.getRange(1, 2).setValue("Report ID");
        }
    }

    if (!ss.getSheetByName("Students")) {
        var studentSheet = ss.insertSheet("Students");
        studentSheet.appendRow(["ID", "Name", "ParentEmail", "Password"]);
    }

    if (!ss.getSheetByName("Topics")) {
        var topicSheet = ss.insertSheet("Topics");
        topicSheet.appendRow(["Topic"]);
        topicSheet.appendRow(["수업 시간 활동", "청소 및 봉사", "자율 활동"]);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput("설치가 완료되었습니다! 시트 구조가 자동 교정되었습니다.").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "uploadPhotos") return handlePhotoUpload(data);
    if (data.action === "changePassword") return changePassword(data.studentId, data.newPassword);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) {
        sheet = ss.insertSheet("Attendance");
        sheet.appendRow(["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"]);
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var lastRow = sheet.getLastRow();
    var nextRow = lastRow + 1;

    var keyToHeader = {
        "timestamp": ["Timestamp", "시각", "타임스탬프"],
        "reportId": ["Report ID", "신고 ID", "신고ID", "ReportID"],
        "studentId": ["Student ID", "학번", "학생 ID", "학생ID", "StudentID"],
        "name": ["Name", "이름"],
        "type": ["Type", "유형", "구분"],
        "status": ["Status", "상태", "승인여부"],
        "reason": ["Reason", "사유", "비고"]
    };

    var colMap = {};
    headers.forEach(function (h, idx) {
        var cleanH = h.toString().trim().toLowerCase();
        for (var key in keyToHeader) {
            if (keyToHeader[key].some(function (match) { return match.toLowerCase() === cleanH; })) {
                colMap[key] = idx + 1;
                break;
            }
        }
    });

    // Default column positions if headers not found (Fallback)
    if (!colMap.timestamp) colMap.timestamp = 1;
    if (!colMap.reportId) colMap.reportId = 2;
    if (!colMap.studentId) colMap.studentId = 3;
    if (!colMap.name) colMap.name = 4;
    if (!colMap.type) colMap.type = 5;
    if (!colMap.status) colMap.status = 6;
    if (!colMap.reason) colMap.reason = 7;

    sheet.getRange(nextRow, colMap.timestamp).setValue(new Date());
    sheet.getRange(nextRow, colMap.reportId).setValue(data.reportId || "");
    sheet.getRange(nextRow, colMap.studentId).setValue(data.studentId || "");
    sheet.getRange(nextRow, colMap.name).setValue(data.name || "");
    sheet.getRange(nextRow, colMap.type).setValue(data.type || "");
    sheet.getRange(nextRow, colMap.status).setValue(data.status || "");
    sheet.getRange(nextRow, colMap.reason).setValue(data.reason || "");

    if (data.status === "PENDING" && data.parentEmail) {
        sendParentNotification(data.parentEmail, data.name, data.type, data.reportId);
    }

    return jsonResponse({ result: "success" });
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
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ result: "error", message: "Student not found" });
}

function getTopics() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Topics");
    if (!sheet) {
        sheet = ss.insertSheet("Topics");
        sheet.appendRow(["Topic"]);
        sheet.appendRow(["수업 시간 활동", "청소 및 봉사", "자율 활동"]);
    }
    var topics = sheet.getDataRange().getValues().slice(1).map(function (row) { return row[0]; }).filter(function (t) { return t !== ""; });

    var rootFolder = DriveApp.getFoldersByName("K-Mates_Uploads").hasNext() ? DriveApp.getFoldersByName("K-Mates_Uploads").next() : DriveApp.createFolder("K-Mates_Uploads");

    topics.forEach(function (topic) {
        if (topic && !rootFolder.getFoldersByName(topic).hasNext()) {
            rootFolder.createFolder(topic);
        }
    });
    return jsonResponse(topics);
}

function handlePhotoUpload(data) {
    var rootFolder = DriveApp.getFoldersByName("K-Mates_Uploads").hasNext() ? DriveApp.getFoldersByName("K-Mates_Uploads").next() : DriveApp.createFolder("K-Mates_Uploads");
    var topicFolder = rootFolder.getFoldersByName(data.topic).hasNext() ? rootFolder.getFoldersByName(data.topic).next() : rootFolder.createFolder(data.topic);

    var today = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    data.images.forEach(function (img, index) {
        var base64Data = img.base64.split(",")[1];
        var decoded = Utilities.base64Decode(base64Data);
        var fileName = today + "_" + data.name + "_" + (index + 1) + ".jpg";
        var blob = Utilities.newBlob(decoded, "image/jpeg", fileName);
        topicFolder.createFile(blob);
    });
    return jsonResponse({ result: "success" });
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

    try { GmailApp.sendEmail(parentEmail, subject, body); } catch (e) { console.error(e); }
}
