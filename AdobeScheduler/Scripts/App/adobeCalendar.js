﻿/// <reference path="~/Scripts/jquery-1.9.1.js"" />
/// <reference path="~/Scripts/jquery.signalR-1.0.0.js" />
/// <reference path="~/Scripts/fullcalendar.js" />

$(function () {
    Events = {};
    $.pnotify.defaults.styling = "jqueryui";
    window.alert = function (message) {
        $.pnotify({
            title: 'Alert',
            text: message
        });
    };

    IsUpdate = false;
    window.max = 50;
    var adobeConnect = $.connection.adobeConnect;

    $('#addAppointment').dialog({
        autoOpen: false,
        show: {
            effect: "fade",
            duration: 300
        },
        hide: {
            effect: "fade",
            duration: 300
        },
        height: 500,
        width: 525,
        modal: true,
        open: function () {
            addAppointment(false, IsUpdate);
        }
    });

    addAppointment = function (checked, isUpdate, jsHandle, event) {
        var roomId = window.Id;
        isUpdate = IsUpdate;
        var userId = (event == undefined) ? $('#content').attr('data-userId') : event.userId;
        var class_name = (event == undefined) ? $('#class option:selected').text() : event.title;
        var url = (event == undefined) ? $('#class option:selected').attr('data-url'): event.adobeUrl;
        var path = (event == undefined) ? $('#class option:selected').attr('data-path') : event.url;
        var datetime = (event == undefined) ? $('#datetime').val() : moment(event.start).format("MM/DD/YYYY hh:mm A");
        var room_size = (event == undefined) ? $('#occupants').val() : event.roomSize;
        var end = (event == undefined) ? $('#duration option:selected').text() : getDuration(event.start, event.end);
        var js = (jsHandle == undefined) ? false : true;
            
        adobeConnect.server.addAppointment(checked, isUpdate, roomId, userId, class_name, room_size, url, path, datetime, end, js)
            .done(function (e) {
                return e;
            });
        if (checked) {
            $('#addAppointment').dialog('close');
        }
    }
    adobeConnect.client.addSelf = function (add, event, max, jsHandle) {
        if (max < 0) { max = 0; }
       var html = "<div class='alert alert-info'><strong style='float:left;'> Warning! </strong>  A maximum of <b> " + max + "</b> occupants <u>including the host</u> are available." + "</div>"
        $("#AppointMent_Submit").prop("disabled", true);
        if (event.roomSize > max) {
            $('#create').attr("disabled", true);
            if (jsHandle)
            {
                var msg = "Event: "+event.title+" update failed. A maximum of " + max + " participants are avabiable for this time period!"
                notifier(false, "Updating", msg,rt,null,'error');
            }
            html = "<div class='alert alert-warning'><strong style='float:left;'> Warning! </strong> Seats are filled or you are over the alloted maximum of <b>" +max+ "</b></div>";
        }
        $('#error').html(html);
        if (add) {
            notifier(false, "Creating", "Event: " + event.title + " successfully created", null, null, 'success');
            $('#calendar').fullCalendar('renderEvent', event, true);
        }

        if (event.roomSize <= max) {
            $('#create').attr("disabled", false);
            if (jsHandle) {
                IsUpdate = true;
                addAppointment(true, IsUpdate, false, event);
            } 

        }
        
    }

    getDuration = function (start, end) {
        start = new Date(start);
        end = new Date(end);
        return (parseInt(end - start) / (1000 * 60));
    }
    adobeConnect.client.callUpdate = function (event) {
        addAppointment(true, true, true, event);
    }

    adobeConnect.client.date = function (date) {
    }

    adobeConnect.client.updateSelf = function (event) {
        notifier(false, "Updating", "Event #"+event.id+": " + event.title+" successfully updated" , null, null, 'success');
        $('#calendar').fullCalendar('removeEvents', event.id);
        $('#calendar').fullCalendar('renderEvent', event,true);
    }

    adobeConnect.client.removeSelf = function (id) {
        $('#calendar').fullCalendar( 'removeEvents' ,id)
    }


    adobeConnect.client.addEvent = function (event, checked, isUpdate, jsHandle) {
        adobeConnect.server.addSelf(event, $('#content').attr('data-userId'), checked, isUpdate, window.max, jsHandle, moment().format("MM/DD/YYYY hh:mm A"))
    }

    notifier = function (pd, title, message, cb, data,type) {
        if (pd) {
            var cur_value = 1,
             progress;
           var loader = $.pnotify({
                title: title,
                text: "<div class=\"progress_bar\" />",
                icon: 'picon picon-throbber',
                hide: false,
                closer: false,
                sticker: false,
                history: false,
                type:type,
                before_open: function (pnotify) {
                    progress = pnotify.find("div.progress_bar");
                    progress.progressbar({
                        value: cur_value
                    });
                    var timer = setInterval(function () {
                        if (cur_value >= 100) {
                            window.clearInterval(timer);
                            loader.pnotify_remove();
                            cb(data);
                            return;
                        }
                        cur_value += .3;
                        progress.progressbar('option', 'value', cur_value);
                    }, 2);
                }
            });
        } else {
            if (cb) {
                cb();
            }
            $.pnotify({
                title: title,
                text: message,
                closer: false,
                sticker: false,
                type: type,
                delay: 7000,
                before_close: function (pnotify) {
                    return true;
                }
            });
        }
    }

    OpenEvents = setInterval(function () {
        var events = $('#calendar').fullCalendar('clientEvents');
        events.forEach(function (event) {
            if (moment() >= event.start) {
                if (!event.open && !event.archived) {
                    event.open = true;
                    adobeConnect.server.getEvent(event.id, moment().format("MM/DD/YYYY hh:mm A")).done(function (event) {
                        $('#calendar').fullCalendar('removeEvents', event.id);
                        $('#calendar').fullCalendar('renderEvent', event, true);
                        alert("Event: "+event.title +" has been opened");
                    })
                   
                }
            }

            if (moment() > event.end) {
                if (event.open && !event.archived) {
                    event.open = false;
                    evrnt.archived = true;
                    adobeConnect.server.getEvent(event.id, moment().format("MM/DD/YYYY hh:mm A")).done(function (event) {
                        $('#calendar').fullCalendar('removeEvents', event.id);
                        $('#calendar').fullCalendar('renderEvent', event, true);
                    });
                }
            }
        });
    }, 30000);

    Calendar = function (events) {
          $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today month',
                    center: 'title',
                    right:''
                },
                titleFormat: {
                    month: '\'<span class="year">\'yyyy\'</span><span class="month">\'MMMM\'</span>\'',
                    day: '\'<span class="day">\'dddd\'</span>\' M/d/yyyy'
                },
                monthNames: [
                    'JANUARY',
                    'FEBRUARY',
                    'MARCH',
                    'APRIL',
                    'MAY',
                    'JUNE',
                    'JULY',
                    'AUGUST',
                    'SEPTEMBER',
                    'OCTOBER',
                    'NOVEMBER',
                    'DECEMBER'
                ],
                monthNamesShort: [
                    'JAN',
                    'FEB',
                    'MAR',
                    'APR',
                    'MAY',
                    'JUN',
                    'JUL',
                    'AUG',
                    'SEP',
                    'OCT',
                    'NOV',
                    'DEC'
                ],
                dayNames: [
                    'SUN',
                    'MON',
                    'TUE',
                    'WED',
                    'THU',
                    'FRI',
                    'SAT'],
                buttonText: {
                    prev: "",
                    next: "",
                    prevYear: "",
                    nextYear: "",
                    today: 'TODAY',
                    month: 'MONTH'
                },
                defaultView: 'month',
                editable: false,
                eventAfterRender: function (event, element, view) {
                    var height = $(element).height();
                },
                loading: function (isLoading) {
                    if (isLoading) {
                        //$('#busy1').activity();
                    }
                    else {
                        $('#busy1');
                    }
                },
                eventRender: function (event, element, view) {
                    var roomHtml;
                    if (view.name == 'month') {
                        roomHtml = "</br><b>Occupants</b>: " + "<u>" + event.roomSize + "</u>";
                        element.find(".fc-event-inner")
                                    .append(roomHtml);
                    }

                    adobeConnect.server.checkHost($('#content').attr('data-userId'), event.title).done(function (e) {
                        if (e && !event.archived) {
                            var html = '<a id="editEvent" href="#' + event.id + '"><i class="ui-icon ui-icon-pencil" style="float:right;"></i></a>'
                            element.find(".fc-event-title").append(
                                    (html));
                        }
                    });

                    if (view.name == 'agendaDay') {
                        roomHtml = event.title+"  "+event.roomSize;
                        element.find(".fc-event-title")
                                    .html(roomHtml);
                    }

                },
                events: function (start, end, cb) {
                    cb(events);
                },
                dayClick: function (date, allDay, jsEvent, view) {
                    if (view.name == 'month') {
                        $('#calendar').fullCalendar('changeView', 'agendaDay');
                        $('#calendar').fullCalendar('gotoDate', date);

                    }

                    if (view.name == 'agendaDay') {
                        $('#datetime').val(moment(date).format("MM/DD/YYYY hh:mm A "));
                        IsUpdate = false;
                        if (moment().subtract('m', 30) > moment(date))
                        { alert("Events cannot be created in the past"); return; }
                        $('#addAppointment').dialog({
                            title: "Create Appointment",
                            buttons: {
                                "create": {
                                    id: 'create',
                                    text: 'Create Appointment',
                                    class: 'create',
                                    click: function () { addAppointment(true) }
                                },
                                "cancel": {
                                    text: 'Cancel',
                                    click: function () { $(this).dialog("close") }
                                }
                            }
                        });
                        $('#addAppointment').dialog('open');
                        
                    }
                },
                eventClick: function (event, element) {
                    if (element.target.tagName == 'I') {
                        window.max = event.roomSize;
                        window.Id = event.id;
                        IsUpdate = true;
                        var cal_hash = element.target.parentElement.hash;
                        $('#class option:selected').text(event.title);
                        $('#datetime').val(moment(event.start).format("MM/DD/YYYY hh:mm A "));
                        $('#occupants').val(event.roomSize);
                        //$('#duration option:selected').text(getDuration(event.start, event.end));
                        $('#duration').val(getDuration(event.start, event.end));
                        var html = "<input type='submit' onclick='delete_confirm()' class='btn btn-danger' style='float:left' value='Delete Appointment' /><input disabled type='submit' onclick='Update()' id='AppointMent_Submit' class='btn btn-success' value='Update Appointment' />";
                        $('.modal-footer').html(html);
                        $('#addAppointment').dialog({
                            title: "Update/Delete Appointment",
                            buttons: {
                                "delete": {
                                    text: 'Delete',
                                    class: 'delete',
                                    click: function () { delete_confirm() }
                                },
                                "update": {
                                    id: 'create',
                                    text: 'Update',
                                    class: 'update',
                                    click: function () { Update() }
                                },
                                "cancel": {
                                    text: 'Cancel',
                                    click: function () { $(this).dialog('close') }
                                }
                            }
                        });
                        $('#addAppointment').dialog('open');

                        delete_confirm = function () {
                            var r = confirm("Are you sure you want to permanantly delete this appoinment?");
                            if (r == true) {
                                adobeConnect.server.delete(event.id);
                                notifier(false, "Deleting", "Event #"+event.id+": " + event.title +" has been deleted", null, null, 'success');
                                $('#addAppointment').dialog('close');
                            }
                        }

                        Update = function () {
                            IsUpdate = true;
                            addAppointment(true, true);
                        }
                    }
                    else {
                        if (event.url) {
                            adobeConnect.server.login($('#content').attr('data-userId')).done(function (res) {
                                if (res != "") {
                                    $('#request').html("<iframe src='" + res + "'" + " ></iframe>");
                                    setTimeout(function () {
                                        $('#loginform').submit();
                                    }, 100);

                                } else {
                                    html = "<div class='alert alert-error'><button type='button' class='close' data-dismiss='alert'>×</button><strong style='float:left;'>Error!</strong> Invalid Credentials </div>";
                                    $('#error').html(html);
                                }

                            });
                            window.open(event.url, event.title);
                        }
                    }
                    return false;
                },
                eventDrop: function (event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
                    if (event.start < Date.now()) {
                        revertFunc();
                        alert("Events cannot be moved to the past");
                        return false;
                    }
                    window.Id = event.id;
                    IsUpdate = true;
                    addAppointment(false, true, true, event);
                    notifier(false, "Updating", "Event: " + event.title, null, null, 'info');
                    rt = revertFunc;

                },
                eventDragStart: function (event, jsEvent, ui, view) {
                },
                eventDragStop: function (event, jsEvent, ui, view) {
                },
                eventResize: function (event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view) {
                    window.Id = event.id;
                    IsUpdate = true;
                    if (getDuration(event.start, event.end) > 90) {
                        revertFunc();
                        alert("Events Cannot be longer than 90 miniutes");
                        return false;
                    }
                    if (event.start < Date.now()) {
                        alert("Events cannot be moved to the past");
                        revertFunc();
                        return false;
                    } 
                    addAppointment(false, true, true, event);
                    notifier(false, "Updating", "Event: " + event.title, null, null, 'info');
                    rt = revertFunc;
                   
                }

            });

    }
    $.connection.hub.start().done(function () {
        adobeConnect.server.getAllAppointments(moment().format("MM/DD/YYYY hh:mm A")).done(Calendar);
    });

                

    
        $('.numbersOnly').keyup(function () {
            this.value = this.value.replace(/[^0-9\.]/g, '');
        });

        $('#occupants').keyup(function (e) {
            if ($('#duration option:selected').text() != '' && $('#occupants').val() != '') {
                addAppointment(false, IsUpdate);
            }
        });

        $('#duration').on('change', function () {
            if ($('#duration option:selected').text() != '' && $('#occupants').val() != '') {
                addAppointment(false, IsUpdate);
            }
        });

    
    // DateTimePicker Set Up
        $('#datetime').datetimepicker({
            minDate: 0,
            timeFormat: "hh:mm TT",
            minuteGrid: 10
        });
        $('#datetime').on('hide', function () {
            addAppointment(false, IsUpdate);
        });

        $('body').on('click', '.ui-datepicker-close', function () {
            addAppointment(false, IsUpdate);
        });

        $('#class').on('blur', function (e) {
            if ($('#duration option:selected').text() != '' && $('#occupants').val() != '') {
                addAppointment(false, IsUpdate);
            }
        });

        $('#reserve_room').click(function () {
            IsUpdate = false;
            $('#datetime').val(moment().format("MM/DD/YYYY hh:mm A "));
            $('#addAppointment').dialog({
                title: "Create Appointment",
                buttons: {
                    "create": {
                        id:'create',
                        text: 'Create Appointment',
                        class: 'create',
                        click: function () {
                            if (moment().subtract('m', 15) > moment($('#datetime').val()))
                            { alert("Events cannot be created in the past"); return; }
                            addAppointment(true)
                        }
                    },
                    "cancel": {
                        text: 'Cancel',
                        click: function () { $(this).dialog("close") }
                    }
                }
            });
            $('#addAppointment').dialog("open");
        });
        

    });


