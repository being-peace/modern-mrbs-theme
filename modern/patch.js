console.log("Hello :) Path: ", window.location.pathname)

function patchElements(elements, patchFunction) {
    //console.log("Now patching: ", elements)
    if (elements === null)
        return

    var elementCount = elements.length
    var copiedElements = [];
    for (i = 0; i < elementCount; i++) {
        copiedElements.push(elements[i])
    }

    for (var element of copiedElements) {
        //console.log("patching", i, " of", elements.length, ": ", element)
        patchFunction(element)
        //console.log(".. done", element)
    }

    //console.log("--- done ---")
}

function patchChildsByTagName(rootElement, tagName, patchFunction, recursive = true) {
    if(!rootElement.childNodes.length > 0)
        return null

    patchElements(rootElement.childNodes, childNode => {
        if(childNode.nodeName === tagName.toUpperCase())
            patchFunction(childNode)
        else if(recursive) {
            patchChildsByTagName(childNode, tagName, patchFunction, recursive)
        }
    })

    return null
}

function patchForm(form, onlyCollapseFieldsetsWithId = true, dontCollapseFirstFieldset = false) {
    form.className = ""
    var firstFieldsetIsDone = false;
    patchElements(form.childNodes, fieldset => {
        if (fieldset.nodeName === "FIELDSET") {
            var fieldsetName = null
            // patch all elements in the fieldset
            patchElements(fieldset.childNodes, formGroup => {
                if (formGroup.nodeName === "DIV" && !(formGroup.classList && (formGroup.classList.contains("none") || formGroup.classList.contains("js_none")))) {
                    formGroup.className = "mb-3"
                    patchElements(formGroup.childNodes, formElement => {
                        patchFormElement(formElement)
                    })
                }
                else if (formGroup.nodeName === "LEGEND" && !onlyCollapseFieldsetsWithId) {
                    patchElements(formGroup.childNodes, childNode => {
                        if(childNode.nodeName !== "#text")
                            childNode.outerHTML = ""
                    })
                    fieldsetName = formGroup.innerHTML
                    formGroup.outerHTML = ""
                }
            })

            // Make the fieldset collapsable
            var fieldsetNames = {
                "registration": "Registrierung",
                "rep_info": "Serieneinstellungen"
            }

            if (onlyCollapseFieldsetsWithId) {
                fieldsetName = fieldsetNames[fieldset.id]
            }

            if(fieldsetName) {
                if (!dontCollapseFirstFieldset || firstFieldsetIsDone) {
                    var mocId = fieldsetName.replaceAll(" ", "_").replaceAll("(", "").replaceAll(")", "");
                    fieldset.outerHTML = `
                    <div class="card mb-4">
                    <div class="card-header" id="heading` + mocId + `">
                    <h5 class="mb-0">
                      <button class="btn dropdown-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#collapse` + mocId + `" aria-expanded="true" aria-controls="collapse` + fieldset.id + `">
                        ` + fieldsetName + `
                      </button>
                    </h5>
                  </div>
              
                  <div id="collapse` + mocId + `" class="collapse" aria-labelledby="heading` + mocId + `">
                    <div class="card card-body">` + fieldset.innerHTML + `</div>
                    </div>
                  </div></div>`
                }

                firstFieldsetIsDone = true
            }
        }
    })
}

function patchFormElement(formElement, depth = 0) {
    if (formElement.classList && (formElement.classList.contains("none") || formElement.classList.contains("js_none")))
        return

    if (formElement.nodeName === "LABEL") {
        if (formElement.childNodes[0] && (formElement.childNodes[0].type === "checkbox" || formElement.childNodes[0].type === "radio")) {
            patchElements(formElement.childNodes, childElement => patchFormElement(childElement))
        }
        else
            formElement.className = "form-label"
    }
    else if (formElement.nodeName === "INPUT" || formElement.nodeName === "TEXTAREA")
        if (formElement.type === "checkbox") {
            formElement.className = "form-check-input"
            formElement.parentElement.className = "form-check form-switch"
        }
        else if (formElement.type === "radio") {
            formElement.className = "form-check-input"
            formElement.parentElement.className = "form-check"
        }
        else if (formElement.type === "submit")
            formElement.className = "btn btn-primary"
        else
            formElement.className = "form-control"
    else if (formElement.nodeName === "SELECT")
        formElement.className = "form-select"
    else if (formElement.nodeName === "DIV") {
        patchElements(formElement.childNodes, childElement => patchFormElement(childElement, depth + 1))
        formElement.className = "row mr-0"
        formElement.setAttribute("width", "100%")
    }

    if (formElement.id === "create_by")
        formElement.parentElement.className = "none"
    else if (formElement.id === "name")
        formElement.setAttribute("value", mrbs_user.displayName)

    if (depth > 0)
        formElement.outerHTML = `<div class="col-md-6 mb-2">` + formElement.outerHTML + `</div>`
}

function patchLoginPage() {
    if (!document.getElementById("logon"))
        return
    var loginForm = document.getElementById("logon");
        loginForm.className = "form-signin";

        var formLabels = document.getElementsByTagName("label")

        for (i = 0; i < formLabels.length; i++)
            formLabels[i].className = "visually-hidden"

        var formInputs = document.getElementsByTagName("input")

        for (i = 0; i < formInputs.length; i++)
            if (formInputs[i].type === "submit")
                formInputs[i].className = "w-100 btn btn-lg btn-primary"

        document.getElementById("password").placeholder = "Passwort"

        var headerLabel = document.getElementsByTagName("legend")[0]
        headerLabel.outerHTML = "<h1 class=\"h3 mb-3 fw-normal\">" + headerLabel.innerHTML + "</h1>"
}

function patchMainPage() {
    if (window.location.pathname !== "/index.php" && window.location.pathname !== "/")
        return

    // patch calendar
    var currentDateElement = document.getElementsByClassName("date")[0]
    var currentDate = currentDateElement.innerHTML

    patchElements(document.getElementsByClassName("main_calendar"), element => {
        element.outerHTML = "<div class=\"d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom\">"
            + "<h2 class=\"h2\" >" + currentDate + "</h1>"
            + "<div class=\"btn-toolbar mb-2 mb-md-0 flex-wrap\" role=\"toolbar\">" + element.innerHTML + "</div></div>"

        //element.outerHTML = "<div class=\"container-fluid\"><div class=\"row\"><h2 class=\"col\" >" + currentDate + "</h1>"  + element.innerHTML + "</div></div>"
    })

    currentDateElement.outerHTML = ""

    // area combobox
    patchElements(document.getElementsByClassName("location"), element => {
        element.parentElement.prepend(element)

        if (element.childNodes.length > 1) {
            var outerHTML = ""
            for (let childNode of element.childNodes) {
                console.log(childNode)
                if (childNode.nodeName == "FORM") {
                    outerHTML += "<div class=\"btn-group col-auto mr-2 mb-2 mb-md-0\" role=\"group\">" + childNode.outerHTML + "</div>"
                }
            }
            element.outerHTML = outerHTML
        }
        else {
            element.outerHTML = "<div class=\"btn-group col-auto mr-2 mb-2 mb-md-0\" role=\"group\">" + element.innerHTML + "</div>"
        }
    })

    patchElements(document.getElementsByClassName("room_area_select"), element => {
        element.className = "w-100 btn btn-sm btn-outline-secondary dropdown-toggle dropdown "
    })

    // day selector 
    patchElements(document.getElementsByClassName("arrow"), element => {
        patchElements(element.childNodes, function (childNode) {
            if (childNode.className === "prev")
                childNode.innerHTML = "<span data-feather=\"chevron-left\"></span>"
            else if (childNode.className === "next")
                childNode.innerHTML = "<span data-feather=\"chevron-right\"></span>"

            childNode.className = "btn btn-sm btn-outline-secondary"
            //element.innerHTML = "<span aria-hidden=\"true\">&laquo;</span>"
        })

        element.outerHTML = "<div class=\"btn-group col-auto mr-2 mb-2 mb-md-0\" role=\"group\">" + element.innerHTML + "</div>"
    })

    // view select
    patchElements(document.getElementsByClassName("view"), element => {
        element.innerHTML = element.childNodes[0].innerHTML
        patchElements(element.childNodes, function (childNode) {
            if (childNode.classList.contains("selected"))
                childNode.className = "active"
            else
                childNode.className = ""

            childNode.className += " btn btn-sm btn-outline-secondary"
            //element.innerHTML = "<span aria-hidden=\"true\">&laquo;</span>"
        })

        element.outerHTML = "<div class=\"btn-group col-auto col-md-0 mr-2 mb-2 mb-md-0\" role=\"group\">" + element.innerHTML + "</div>"
    })
}

function patchEditEntry() {
    if (window.location.pathname !== "/edit_entry.php")
        return

    var form = document.getElementById("main")
    form.parentElement.className = "container"
    form.className = ""

    // remove byck button
    document.getElementsByName("back_button")[0].outerHTML = ""
    document.getElementById("checks").outerHTML = ""

    patchForm(form, true)
}

function patchViewEntry() {
    if (window.location.pathname !== "/view_entry.php")
        return

    document.getElementById("returl").outerHTML = ""

    patchElements(document.getElementById("username"), element => element.parentElement.style = "display: none")

    // patch table
    patchElements(document.getElementsByTagName("table"), table => {
        if (table.id !== "registrants")
            return
        table.className = "table table-bordered table-hover table-striped"
        var rows = table.rows
        for (var row of rows) {
            if (!mrbs_user.isAdmin) {
                row.deleteCell(0)
                row.deleteCell(1)
            }
            else {
                row.deleteCell(2)
            }
        }
    })

    // remove copy button
    patchElements(document.getElementsByName("copy"), element => {
        element.parentElement.parentElement.parentElement.outerHTML = ""
    })

    patchElements(document.getElementsByName("action"), element => {
        if (element.value === "export") {
            element.parentElement.parentElement.parentElement.outerHTML = ""
        }
    })
}

function patchAdministration() {
    if (window.location.pathname !== "/admin.php" || !document.getElementById("area_form"))
        return

    patchElements(document.getElementsByTagName("form"), form => {
        if (form.classList && form.classList.contains("areaChangeForm")) {
            // move the edit and delet buttons in place and patch them
            patchElements(form.childNodes, fieldset => {
                if(fieldset.nodeName === "FIELDSET")
                patchElements(fieldset.childNodes, childNode => {
                    console.log(childNode.nodeName)
                    if (childNode.nodeName === "BUTTON") {
                        var innerIcon = ""
                        if (childNode.childNodes[1] && childNode.childNodes[1].src && childNode.childNodes[1].src.includes("edit")) {
                            childNode.className = "btn btn-outline-secondary mr-2 mb-2"
                            innerIcon = "edit"
                        }
                        else {
                            childNode.className = "btn btn-outline-danger mr-2 mb-2"
                            innerIcon = "trash"
                        }

                        childNode.innerHTML = "<span class=\"mr-2\" data-feather=\"" + innerIcon + "\"></span>" + childNode.title
                    }
                })
            })
        }
        patchForm(form, false)
    })

    var table = document.getElementById("rooms_table")
    table.className = "table table-bordered table-hover table-striped"
    var rows = table.rows
    for (var row of rows) {
        patchChildsByTagName(row.cells[0], "span", span => span.className = "none")
        patchChildsByTagName(row.cells[1], "div", div => {
            console.log(div.childNodes)
            if(div.innerHTML.length > 10)
                div.innerHTML = "<span class=\"mr-2\" data-feather=\"check-square\"></span>"
            else
                div.innerHTML = "<span class=\"mr-2\" data-feather=\"x-square\"></span>"
        })
        
        patchChildsByTagName(row.cells[6], "input", input => {
            if(input.classList && input.classList.contains("button"))
                input.outerHTML = input.outerHTML.replaceAll("input", "button")
        })

        patchChildsByTagName(row.cells[6], "button", input => {
            input.src = ""
            input.type = "button"
            input.className = "btn btn-outline-danger"
            input.innerHTML = "<span class=\"mr-2\" data-feather=\"trash\"></span>" + input.title
        })

        row.cells[6].innerHTML.replaceAll("class=\"button\"", "class=\"btn\"")
    }
}

function patchEditArea() {
    if (window.location.pathname !== "/edit_area.php")
        return

    patchChildsByTagName(document.getElementById("edit_area"), "fieldset", fieldset => {
        fieldset.outerHTML = fieldset.innerHTML
    }, false)

    patchForm(document.getElementById("edit_area"), false, true)

    patchElements(document.getElementsByClassName("btn-outline-dark"), button => {
        // remove back button
        if(button.getAttribute("formaction") === "admin.php")
            button.outerHTML = ""
    })
}

function patchEditRoom() {
    if (window.location.pathname !== "/edit_room.php")
        return

    patchChildsByTagName(document.getElementById("edit_room"), "fieldset", fieldset => {
        fieldset.outerHTML = fieldset.innerHTML
    }, false)

    patchForm(document.getElementById("edit_room"))

    patchElements(document.getElementsByClassName("btn-outline-dark"), button => {
        // remove back button
        if(button.getAttribute("formaction") === "admin.php")
            button.outerHTML = ""
    })
}

function patchImport() {
    if (window.location.pathname !== "/import.php")
        return

    patchElements(document.getElementsByTagName("form"), form => {
        if(form.getAttribute("action") == "import.php") {
            patchChildsByTagName(form, "fieldset", fieldset => {
                fieldset.outerHTML = fieldset.innerHTML
            }, false)

            patchForm(form)
        }
    })
}

function patchReport() {
    if (window.location.pathname !== "/report.php")
        return

        patchChildsByTagName(document.getElementById("report_form"), "fieldset", fieldset => {
            fieldset.outerHTML = fieldset.innerHTML
        }, false)
    
        patchForm(document.getElementById("report_form"))
        
}

function patchSiteStructure() {

    // general patch of standard elements
    var buttons = document.getElementsByTagName('input'),
        len = buttons !== null ? buttons.length : 0,
        i = 0;
    for (i; i < len; i++) {
        if (buttons[i].type === "submit")
            if (buttons[i].classList.contains("default_action"))
                buttons[i].className += " btn btn-outline-primary";
            else if (buttons[i].parentElement.parentElement.classList.contains("navbar-nav"))
                buttons[i].className += " btn btn-outline-light";
            else
                buttons[i].className += " btn btn-outline-dark";
        else if (buttons[i].type === "text" || buttons[i].type === "password") {
            buttons[i].className += " form-control"
            buttons[i].parentElement.className = "form-group"
        }
    }

    patchLoginPage()
patchMainPage()
patchEditEntry()
patchViewEntry()
patchAdministration()
patchEditArea()
patchEditRoom()
patchImport()
patchReport()

}

// this runs before jquery
patchSiteStructure()

feather.replace()