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
    if (action === "getAnnouncements") return jsonResponse(getAnnouncementsData());
    if (action === "getChatbotData") return jsonResponse(getChatbotData());
    if (action === "getSetting") return jsonResponse({ value: getSetting(e.parameter.key) });
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
    if (data.length < 2) return [];

    var headers = data.shift();
    var headerMap = {};

    // Build a map of column index for each standard key
    headers.forEach(function (h, i) {
        var cleanH = h.toString().toLowerCase().replace(/\s/g, "");
        if (cleanH.indexOf("timestamp") > -1 || cleanH.indexOf("시각") > -1) headerMap.timestamp = i;
        else if (cleanH.indexOf("reportid") > -1 || cleanH.indexOf("신고id") > -1) headerMap.reportid = i;
        else if (cleanH.indexOf("studentid") > -1 || cleanH.indexOf("학번") > -1) headerMap.studentid = i;
        else if (cleanH.indexOf("name") > -1 || cleanH.indexOf("이름") > -1) headerMap.name = i;
        else if (cleanH.indexOf("type") > -1 || cleanH.indexOf("유형") > -1 || cleanH.indexOf("구분") > -1) headerMap.type = i;
        else if (cleanH.indexOf("status") > -1 || cleanH.indexOf("상태") > -1 || cleanH.indexOf("승인") > -1) headerMap.status = i;
        else if (cleanH.indexOf("reason") > -1 || cleanH.indexOf("사유") > -1 || cleanH.indexOf("내용") > -1) headerMap.reason = i;
        else if (cleanH.indexOf("targetdate") > -1 || cleanH.indexOf("대상") > -1) headerMap.targetdate = i;
    });

    return data.map(function (row) {
        var item = {};
        // Default mapping based on header analysis
        if (headerMap.timestamp !== undefined) item.timestamp = row[headerMap.timestamp];
        if (headerMap.reportid !== undefined) item.reportid = row[headerMap.reportid];
        if (headerMap.studentid !== undefined) item.studentid = row[headerMap.studentid];
        if (headerMap.name !== undefined) item.name = row[headerMap.name];
        if (headerMap.type !== undefined) item.type = row[headerMap.type];
        if (headerMap.status !== undefined) item.status = row[headerMap.status];
        if (headerMap.reason !== undefined) item.reason = row[headerMap.reason];
        if (headerMap.targetdate !== undefined) item.targetdate = row[headerMap.targetdate];

        // Fallback: If headers failed (e.g. English vs Korean mismatch), try fixed indices
        // Assuming standard order: Timestamp, ReportID, StudentID, Name, Type, Status, Reason, TargetDate
        if (!item.timestamp && row[0]) item.timestamp = row[0];
        if (!item.type && row[4]) item.type = row[4];
        if (!item.status && row[5]) item.status = row[5];

        // HEURISTIC FIX for Shifting Data (Row 16 vs Row 17 issue)
        // If 'studentid' seems to be a Name (not digits) AND 'reportid' looks like ID (digits)
        // It means data is shifted left (ReportID column holds StudentID)
        var sIdStr = item.studentid ? item.studentid.toString() : "";
        var rIdStr = item.reportid ? item.reportid.toString() : "";

        if ((!sIdStr || isNaN(Number(sIdStr))) && !isNaN(Number(rIdStr)) && rIdStr.length >= 4) {
            // Shift Mapping
            item.studentid = rIdStr; // ReportID col has StudentID
            // Trying to find Name. Usually next col to StudentID.
            // If we used headerMap.studentid for shifted data, it likely holds Name.
            if (headerMap.studentid !== undefined && row[headerMap.studentid]) {
                item.name = row[headerMap.studentid];
            }
        }

        return item;
    }).filter(function (item) {
        // Relaxed filter: Allow rows with timestamp OR studentid (as screenshot showed missing timestamps)
        return (item.timestamp && item.timestamp !== "") || (item.studentid && item.studentid !== "");
    });
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
        if (data.action === "bindDevice") return bindDevice(data.studentId, data.deviceId);

        // Settings Management
        if (data.action === "saveSetting") return saveSetting(data.key, data.value);

        // Announcements Management
        if (data.action === "addAnnouncement") return addAnnouncement(data);
        if (data.action === "updateAnnouncement") return updateAnnouncement(data);
        if (data.action === "deleteAnnouncement") return deleteAnnouncement(data.id);

        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName("Attendance");
        if (!sheet) {
            sheet = ss.insertSheet("Attendance");
            sheet.appendRow(["Timestamp", "Report ID", "Student ID", "Name", "Type", "Status", "Reason"]);
        }

        var headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0];

        var requiredHeaders = {
            "timestamp": ["Timestamp", "시각", "타임스탬프"],
            "reportId": ["Report ID", "신고 ID", "신고ID", "ReportID"],
            "studentId": ["Student ID", "학번", "학생 ID", "StudentID"],
            "name": ["Name", "이름", "성명"],
            "type": ["Type", "유형", "구분"],
            "status": ["Status", "상태", "승인여부"],
            "reason": ["Reason", "사유", "비고"],
            "targetDate": ["Target Date", "대상 날짜", "TargetDate"]
        };

        var colMap = {};
        var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0]; // Re-fetch headers

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
            if (!found) {
                var newCol = (sheet.getLastColumn() || 0) + 1;
                sheet.getRange(1, newCol).setValue(requiredHeaders[key][0]);
                colMap[key] = newCol;
                // Update local headerRow correctly if simpler
            }
        }

        var nextRow = sheet.getLastRow() + 1;
        var now = new Date();
        var timeZone = ss.getSpreadsheetTimeZone();

        // Ensure colMap keys exist before using
        if (colMap.timestamp) sheet.getRange(nextRow, colMap.timestamp).setValue(Utilities.formatDate(now, timeZone, "yyyy-MM-dd HH:mm:ss"));
        if (colMap.reportId) sheet.getRange(nextRow, colMap.reportId).setValue(data.reportId || "");
        if (colMap.studentId) sheet.getRange(nextRow, colMap.studentId).setValue(data.studentId || "");
        if (colMap.name) sheet.getRange(nextRow, colMap.name).setValue(data.name || "");
        if (colMap.type) sheet.getRange(nextRow, colMap.type).setValue(data.type || "");
        if (colMap.status) sheet.getRange(nextRow, colMap.status).setValue(data.status || "CONFIRMED");
        if (colMap.reason) sheet.getRange(nextRow, colMap.reason).setValue(data.reason || "");

        // Use targetDate from data, or default to NOW's date only (YYYY-MM-dd)
        var tDate = data.targetDate || Utilities.formatDate(now, timeZone, "yyyy-MM-dd");
        if (colMap.targetDate) sheet.getRange(nextRow, colMap.targetDate).setValue(tDate);

        if (data.status === "PENDING" && data.parentEmail) {
            sendParentNotification(data.parentEmail, data.name, data.type, data.reportId, data.appUrl);
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

    var ridIdx = -1;
    var sidIdx = -1;
    var statusIdx = -1;

    for (var j = 0; j < headers.length; j++) {
        var h = headers[j];
        if (h.indexOf("reportid") > -1 || h.indexOf("신고id") > -1) ridIdx = j;
        if (h.indexOf("studentid") > -1 || h.indexOf("학번") > -1) sidIdx = j;
        if (h.indexOf("status") > -1 || h.indexOf("상태") > -1) statusIdx = j;
    }

    if (statusIdx === -1) statusIdx = 5;

    for (var i = 1; i < data.length; i++) {
        var target = id.toString().trim();
        var rowRid = ridIdx !== -1 ? data[i][ridIdx].toString().trim() : "";
        var rowSid = sidIdx !== -1 ? data[i][sidIdx].toString().trim() : "";

        if (rowRid === target || rowSid === target) {
            sheet.getRange(i + 1, statusIdx + 1).setValue(status);

            // Notify Teacher if Confirmed
            // Check for various forms of 'Confirmed' status
            if (status === "CONFIRMED" || status === "승인" || status === "confirmed") {
                // Use fixed indices based on standard layout:
                // 0:Timestamp, 1:ReportID, 2:StudentID, 3:Name, 4:Type, 5:Status, 6:Reason
                // Fallback to these if header search failed earlier or is complex
                var name = data[i][3];
                var type = data[i][4];
                var reason = data[i][6];

                // If headers were found, try to use them, but fallback to fixed
                if (headers && headers.length > 0) {
                    // Simple scan again just to be safe, or stick to fixed if layout is known
                    // Let's stick to fixed as it's less error prone if headers are weird
                }

                console.log("Sending teacher email for:", name, type, reason);
                sendTeacherNotification(name, type, reason);
            }

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
            else if (k === "deviceid" || k === "기기id") obj.deviceId = row[j].toString().trim();
        });
        if (!obj.password || obj.password === "") obj.password = obj.id;
        return obj;
    }).filter(function (s) { return s.id; });

    return jsonResponse(students);
}

function bindDevice(studentId, deviceId) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students");
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return h.toString().toLowerCase().trim(); });
    var dIdx = headers.indexOf("deviceid") === -1 ? headers.indexOf("기기id") : headers.indexOf("deviceid");

    if (dIdx === -1) {
        sheet.getRange(1, headers.length + 1).setValue("DeviceId");
        dIdx = headers.length;
    }

    for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === studentId.toString().trim()) {
            sheet.getRange(i + 1, dIdx + 1).setValue(deviceId);
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ result: "error" });
}

/**
 * Announcement Management
 */
function getAnnouncementsData() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Announcements");
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var headers = data.shift().map(function (h) { return h.toString().toLowerCase().trim(); });

    return data.map(function (row, i) {
        var obj = { rowIdx: i + 2 };
        headers.forEach(function (h, j) {
            obj[h] = row[j];
        });
        return obj;
    }).reverse(); // Latest first
}

function addAnnouncement(data) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Announcements");
    if (!sheet) {
        sheet = ss.insertSheet("Announcements");
        sheet.appendRow(["ID", "Date", "Category", "Title", "Content"]);
    }

    var id = Math.random().toString(36).substr(2, 9);
    var date = data.date || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    sheet.appendRow([id, date, data.category, data.title, data.content]);
    return jsonResponse({ result: "success" });
}

function updateAnnouncement(data) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Announcements");
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (h) { return h.toString().toLowerCase().trim(); });

    var idIdx = headers.indexOf("id");
    var categoryIdx = headers.indexOf("category");
    var titleIdx = headers.indexOf("title");
    var contentIdx = headers.indexOf("content");

    for (var i = 1; i < values.length; i++) {
        if (values[i][idIdx].toString() === data.id.toString()) {
            if (categoryIdx !== -1) sheet.getRange(i + 1, categoryIdx + 1).setValue(data.category);
            if (titleIdx !== -1) sheet.getRange(i + 1, titleIdx + 1).setValue(data.title);
            if (contentIdx !== -1) sheet.getRange(i + 1, contentIdx + 1).setValue(data.content);
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ result: "error", message: "Announcement not found" });
}

function deleteAnnouncement(id) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Announcements");
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === id.toString()) {
            sheet.deleteRow(i + 1);
            return jsonResponse({ result: "success" });
        }
    }
    return jsonResponse({ result: "error" });
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
        attendSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Students Sheet
    if (!ss.getSheetByName("Students")) {
        var studentSheet = ss.insertSheet("Students");
        studentSheet.appendRow(["ID", "Name", "ParentEmail", "Password", "DeviceId"]);
    }

    // Announcements Sheet
    if (!ss.getSheetByName("Announcements")) {
        var annSheet = ss.insertSheet("Announcements");
        annSheet.appendRow(["ID", "Date", "Category", "Title", "Content"]);
        annSheet.appendRow([Math.random().toString(36).substr(2, 9), Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd"), "공지", "Class-Mates 서비스 시작", "스마트 출결 관리 서비스를 시작합니다."]);
    }

    // Chatbot Sheet
    if (!ss.getSheetByName("Chatbot")) {
        var chatSheet = ss.insertSheet("Chatbot");
        chatSheet.appendRow(["Keyword", "Response", "Category"]);
        chatSheet.appendRow(["와이파이", "학교 와이파이 비밀번호는 'school1234' 입니다.", "정보"]);
        chatSheet.appendRow(["급식", "오늘의 급식 메뉴는 학교 홈페이지 > 식단표에서 확인하세요.", "정보"]);
        chatSheet.appendRow(["보건실", "보건실은 2층 교무실 옆에 있습니다.", "위치"]);
        chatSheet.appendRow(["교무실", "교무실은 2층 중앙 계단 오른쪽에 있습니다.", "위치"]);
        chatSheet.appendRow(["등교", "등교 시간은 08:50까지 입니다.", "규정"]);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput("설치가 완료되었습니다! 시트 구조가 최신 사양으로 업데이트되었습니다.").setMimeType(ContentService.MimeType.TEXT);
}

function getChatbotData() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Chatbot");
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var headers = data.shift(); // Remove headers
    return data.map(function (row) {
        return { keyword: row[0], response: row[1], category: row[2] };
    }).filter(function (item) { return item.keyword && item.response; });
}

function handlePhotoUpload(data) {
    var rootFolder = DriveApp.getFoldersByName("Class-Mates_Uploads").hasNext() ? DriveApp.getFoldersByName("Class-Mates_Uploads").next() : DriveApp.createFolder("Class-Mates_Uploads");
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

function sendParentNotification(parentEmail, studentName, reason, reportId, appUrl) {
    // appUrl이 전달되지 않은 경우 기본값 사용
    if (!appUrl) appUrl = "https://check-in-ten-xi.vercel.app";
    var verifyUrl = appUrl + "/verify/" + reportId;
    var subject = "[Class-Mates] " + studentName + " 학생의 출결 신고 확인 요청";

    // HTML Email Template
    var htmlBody = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 36px; font-weight: 800;">학부모님, 안녕하세요.</h2>
          <p style="color: #64748b; font-size: 24px; line-height: 1.6;">
            <strong>${studentName}</strong> 학생으로부터 아래와 같은 출결 신고가 접수되었습니다.<br>
            내용을 확인하시고, 사실과 같다면 아래 버튼을 눌러 승인해 주세요.
          </p>
          
          <div style="margin: 40px 0;">
            <p style="color: #94a3b8; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">상세 사유</p>
            <div style="background-color: #f1f5f9; padding: 32px; border-radius: 20px; color: #334155; font-size: 28px; font-weight: 600; min-height: 100px; border: 1px solid #e2e8f0;">
              ${reason}
            </div>
          </div>

          <div style="height: 60px;"></div>

          <div style="text-align: center;">
            <a href="${verifyUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 24px 50px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 24px; display: inline-block; box-shadow: 0 6px 10px rgba(59, 130, 246, 0.3);">
              ✅ 신고 내역 승인하기
            </a>
          </div>
          
          <p style="margin-top: 60px; text-align: center; color: #cbd5e1; font-size: 16px;">
            본 메일은 학교 출결 관리 시스템에서 자동으로 발송되었습니다.
          </p>
        </div>
      </div>
    `;

    try {
        GmailApp.sendEmail(parentEmail, subject, "", { htmlBody: htmlBody });
    } catch (e) {
        console.error(e);
    }
}
// ... existing code ...

/**
 * Send email notification to Teacher
 */
function sendTeacherNotification(studentName, type, reason) {
    var teacherEmail = "dream815@nate.com";
    var subject = "[출석 리포트] " + studentName + " 승인 알림";
    var htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>출결 신고 승인 알림</h2>
      <p><strong>${studentName}</strong> 학생의 <strong>${type}</strong> 신고가 학부모님에 의해 승인되었습니다.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #666; font-size: 14px;">사유</p>
        <p style="margin: 5px 0 0 0; font-weight: bold;">${reason}</p>
      </div>
      <p style="font-size: 12px; color: #888;">본 메일은 자동 발송되었습니다.</p>
    </div>
  `;

    try {
        console.log("Attempting to send teacher email to:", teacherEmail);
        // GmailApp is generally more reliable for these triggers
        GmailApp.sendEmail(teacherEmail, subject, "", { htmlBody: htmlBody });
        console.log("Teacher email sent successfully.");
    } catch (e) {
        console.error("Teacher email failed: " + e.toString());
    }
}

// ── Settings ──────────────────────────────────────────────
function getSetting(key) {
    var props = PropertiesService.getScriptProperties();
    var val = props.getProperty(key);
    return val !== null ? val : null;
}

function saveSetting(key, value) {
    PropertiesService.getScriptProperties().setProperty(key, String(value));
    return jsonResponse({ result: "success" });
}
