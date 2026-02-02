/**
 * Google Apps Script for the School Life App
 * Attach this to your Google Sheet (Extensions > Apps Script)
 */

function doGet(e) {
    var action = e.parameter.action;
    if (action === "setup") return setup();
    if (action === "getStudents") return getStudents();
    if (action === "getReport") return jsonResponse(getReportData(e.parameter.id));
    if (action === "updateReportStatus") return updateReportStatus(e.parameter.id, e.parameter.status);
    if (action === "getTopics") return getTopics();
    if (action === "getAttendance") return jsonResponse(getAttendanceData());
    return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Robust Attendance Data Fetching
 */
function getAttendanceData() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    if (data.length < 1) return [];

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

        // HEURISTIC: Fix data if it's shifted or mismatched
        // If studentid looks like a random ID (report ID)
        if (obj.studentid && obj.studentid.length < 12 && isNaN(Number(obj.studentid))) {
            // Case 1: studentid contains the random reportId
            // And usually name contains studentId, type contains Name, status contains Type, reason contains Status, extra contains Reason
            if (obj.status && (obj.status.indexOf("10") === 0 || obj.status.indexOf("20") === 0 || obj.status.indexOf("30") === 0)) {
                // Wait, if status is studentId? Let's use more obvious clues.
            }

            // If the row has more columns than headers, or columns are just wrong
            // Let's look for specific values
            var rowStr = row.join("|");
            if (rowStr.indexOf("PENDING") > -1 || rowStr.indexOf("CONFIRMED") > -1 || rowStr.indexOf("대기") > -1) {
                // If the "reportid" link is broken, we must make sure the object has the correct fields
                // Let's re-scan the whole row for things that look like what they are
                row.forEach(function (val) {
                    var v = val.toString().trim();
                    if (v === "PENDING" || v === "CONFIRMED" || v === "REJECTED" || v === "대기") obj.status = v;
                    else if (v === "결석" || v === "지각" || v === "조퇴" || v === "기타") obj.type = v;
                    else if (v.length === 5 && !isNaN(Number(v))) obj.studentid = v;
                    else if (v.length === 9 && isNaN(Number(v)) && v.match(/[a-z0-9]/)) obj.reportid = v;
                    // Note: this is a bit aggressive but helps with shifted data
                });
            }
        }

        // Final fallback: if reportid is missing but studentid looks like reportid
        if (!obj.reportid && obj.studentid && obj.studentid.length === 9 && isNaN(Number(obj.studentid))) {
            obj.reportid = obj.studentid;
        }

        return obj;
    }).filter(function (r) { return r.timestamp && r.timestamp !== ""; });
}

function getReportData(id) {
    var records = getAttendanceData();
    var match = records.find(function (r) {
        var rid = r.reportid ? r.reportid.toString().trim() : "";
        var sid = r.studentid ? r.studentid.toString().trim() : "";
        var target = id.toString().trim();
        return rid === target || sid === target;
    });
    return match || { error: "Report not found with ID: " + id };
}

/**
 * Intelligent Data Writing
 */
function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        if (data.action === "uploadPhotos") return handlePhotoUpload(data);
        if (data.action === "changePassword") return changePassword(data.studentId, data.newPassword);

        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName("Attendance");
        if (!sheet) {
            sheet = ss.insertSheet("Attendance");
            sheet.appendRow(["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"]);
        }

        var headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0];

        // Define our required headers and map them to columns
        var requiredHeaders = {
            "timestamp": ["Timestamp", "시각", "타임스탬프"],
            "reportId": ["Report ID", "신고 ID", "신고ID", "ReportID"],
            "studentId": ["Student ID", "학번", "학생 ID", "StudentID"],
            "name": ["Name", "이름", "성명"],
            "type": ["Type", "유형", "구분"],
            "status": ["Status", "상태", "승인여부"],
            "reason": ["Reason", "사유", "비고"]
        };

        var colMap = {};
        for (var key in requiredHeaders) {
            var found = false;
            for (var i = 0; i < headerRow.length; i++) {
                var h = headerRow[i].toString().trim().toLowerCase();
                if (requiredHeaders[key].some(function (m) { return m.toLowerCase() === h; })) {
                    colMap[key] = i + 1;
                    found = true;
                    break;
                }
            }
            // If not found, add it to the first empty column
            if (!found) {
                var newCol = sheet.getLastColumn() + 1;
                sheet.getRange(1, newCol).setValue(requiredHeaders[key][0]);
                colMap[key] = newCol;
                // Update local headerRow for next keys
                headerRow[newCol - 1] = requiredHeaders[key][0];
            }
        }

        var nextRow = sheet.getLastRow() + 1;
        sheet.getRange(nextRow, colMap.timestamp).setValue(new Date());
        sheet.getRange(nextRow, colMap.reportId).setValue(data.reportId || "");
        sheet.getRange(nextRow, colMap.studentId).setValue(data.studentId || "");
        sheet.getRange(nextRow, colMap.name).setValue(data.name || "");
        sheet.getRange(nextRow, colMap.type).setValue(data.type || "");
        sheet.getRange(nextRow, colMap.status).setValue(data.status || "CONFIRMED");
        sheet.getRange(nextRow, colMap.reason).setValue(data.reason || "");

        if (data.status === "PENDING" && data.parentEmail) {
            sendParentNotification(data.parentEmail, data.name, data.type, data.reportId);
        }

        return jsonResponse({ result: "success" });
    } catch (err) {
        return jsonResponse({ result: "error", message: err.toString() });
    }
}

function updateReportStatus(id, status) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Attendance");
    if (!sheet) return jsonResponse({ error: "No sheet" });

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase().replace(/\s/g, ""); });

    // Find Report ID column or Student ID column
    var ridIdx = -1;
    var sidIdx = -1;
    var statusIdx = -1;

    for (var j = 0; j < headers.length; j++) {
        var h = headers[j];
        if (h.indexOf("reportid") > -1 || h.indexOf("신고id") > -1) ridIdx = j;
        if (h.indexOf("studentid") > -1 || h.indexOf("학번") > -1) sidIdx = j;
        if (h.indexOf("status") > -1 || h.indexOf("상태") > -1) statusIdx = j;
    }

    if (statusIdx === -1) statusIdx = 5; // Default to Status col if metadata fails

    for (var i = 1; i < data.length; i++) {
        var target = id.toString().trim();
        var rowRid = ridIdx !== -1 ? data[i][ridIdx].toString().trim() : "";
        var rowSid = sidIdx !== -1 ? data[i][sidIdx].toString().trim() : "";

        if (rowRid === target || rowSid === target) {
            sheet.getRange(i + 1, statusIdx + 1).setValue(status);
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ error: "Report not found with ID: " + id });
}

function getStudents() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students");
    if (!sheet) return jsonResponse([]);

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var students = data.map(function (row) {
        var obj = {};
        headers.forEach(function (h, j) {
            var k = h.toString().toLowerCase().trim();
            if (k === "id" || k === "학번") obj.id = row[j].toString().trim();
            else if (k === "name" || k === "이름") obj.name = row[j];
            else if (k === "parentemail" || k === "학부모이메일") obj.parentemail = row[j];
            else if (k === "password" || k === "비밀번호") obj.password = row[j];
        });
        if (!obj.password || obj.password === "") obj.password = obj.id;
        return obj;
    }).filter(function (s) { return s.id; });

    return jsonResponse(students);
}

function setup() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Attendance Sheet
    var attendSheet = ss.getSheetByName("Attendance");
    var headers = ["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"];
    if (!attendSheet) {
        attendSheet = ss.insertSheet("Attendance");
        attendSheet.appendRow(headers);
    } else {
        // Overwrite headers to be sure
        attendSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Students Sheet
    if (!ss.getSheetByName("Students")) {
        var studentSheet = ss.insertSheet("Students");
        studentSheet.appendRow(["ID", "Name", "ParentEmail", "Password"]);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput("설치가 완료되었습니다! 시트 구조가 최신 사양으로 업데이트되었습니다.").setMimeType(ContentService.MimeType.TEXT);
}

function handlePhotoUpload(data) {
    var rootFolder = DriveApp.getFoldersByName("K-Mates_Uploads").hasNext() ? DriveApp.getFoldersByName("K-Mates_Uploads").next() : DriveApp.createFolder("K-Mates_Uploads");
    var topicFolder = rootFolder.getFoldersByName(data.topic).hasNext() ? rootFolder.getFoldersByName(data.topic).next() : rootFolder.createFolder(data.topic);
    var today = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    data.images.forEach(function (img, index) {
        var blob = Utilities.newBlob(Utilities.base64Decode(img.base64.split(",")[1]), "image/jpeg", today + "_" + data.name + "_" + (index + 1) + ".jpg");
        topicFolder.createFile(blob);
    });
    return jsonResponse({ result: "success" });
}

function changePassword(studentId, newPassword) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students");
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase().trim(); });
    var pIdx = headers.indexOf("password") === -1 ? headers.indexOf("비밀번호") : headers.indexOf("password");
    if (pIdx === -1) { sheet.getRange(1, headers.length + 1).setValue("Password"); pIdx = headers.length; }

    for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === studentId.toString().trim()) {
            sheet.getRange(i + 1, pIdx + 1).setValue(newPassword);
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ result: "error" });
}

function getTopics() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Topics") || ss.insertSheet("Topics");
    var data = sheet.getDataRange().getValues().slice(1).map(function (r) { return r[0]; }).filter(function (t) { return t !== ""; });
    return jsonResponse(data);
}

function sendParentNotification(parentEmail, studentName, reason, reportId) {
    var appUrl = "https://check-in-final.vercel.app";
    var verifyUrl = appUrl + "/verify/" + reportId;
    var subject = "[K-Mates] " + studentName + " 학부모 확인 요청 (" + reason + ")";
    var body = studentName + " 학생의 " + reason + " 신고가 접수되었습니다.\n\n" +
        "위 내용이 맞다면 아래 확인 링크를 클릭해 주세요:\n" + verifyUrl + "\n\n" +
        "* 본 메일은 학교 출결 시스템에서 자동 발송되었습니다.";
    try { GmailApp.sendEmail(parentEmail, subject, body); } catch (e) { console.error(e); }
}
