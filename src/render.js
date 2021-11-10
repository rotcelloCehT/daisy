const { ipcRenderer, remote } = require('electron');
var exifr = require('exifr');
const path = require('path');
const fs = require('fs');
const storage = require('electron-json-storage');
const { totalmem } = require('os');

// GLOBALS
var srcPath; // SOURCE PATH
var outPath; // OUTPUT PATH
var groupIndex = 1; // New index for each grouping of folders
var imageArray = []; // 
var folderArray = []; // 
var selectedFolders = []; // Selection of what to group or rename
// USE VARIABLE THAT CHANGES WHEN THE THEME CHANGES SO THAT NEWLY ADDED FOLDERS HAVE THE PROPER BACKGROUND
var folderImgSource = './images/folderImage.svg';
// console
photoCounter = 0;
folderCounter = 0;


// CLOSE BUTTON ELECTRON
const closeBtn = document.getElementById('closeBtn');
closeBtn.addEventListener('click', function() {
  var window = remote.getCurrentWindow();
  window.close();
})
// MINIMIZE BUTTON ELECTRON
const minBtn = document.getElementById('minBtn');
minBtn.addEventListener('click', function() {
  var window = remote.getCurrentWindow();
  window.minimize();
})
// MAXIMIZES BUTTON ELECTRON
const maxBtn = document.getElementById('maxBtn');
maxBtn.addEventListener('click', function() {
  var window = remote.getCurrentWindow();
  window.isMaximized() ? window.unmaximize() : window.maximize()
})


// THEME DARK AND LIGHT -------------------------------------------------------------
// CHECKBOX THEME EVENT LISTENER
// !!!Theme change was implemented in previous version but immoted for first release.!!!
var checkbox = document.querySelector("input[name=checkbox]");
var folderListContainer = document.getElementsByClassName('folder-list-container');
var folderImg = document.getElementsByClassName('folder-img');
var folderSize = document.getElementsByClassName('folder-size');
var folderSizeColors = ["#FFB142", "#5E7285"];

// CHANGE TITLE FUNCTION
function ChangeTitle (title) {
  titleShown = document.getElementById('title-shown');
  titleImage = document.getElementById('title-image');
  if(title) {
    titleShown.innerHTML = title;
    titleShown.style = "display: block";
    titleImage.style = "display: none";
  }
  else {
    titleShown.style = "display: none";
    titleImage.style = "display: block";
  };
};

// CHANGE BUTTON COLOR STATUS
function ChangeButtonStatus (button, valid) {
  if (!valid) {
    button.style.backgroundColor = '#FFB142';
    button.children[1].style = "display: none";
  }
  else {
    button.style.backgroundColor = '#33D9B2';
    button.children[1].style = "display: block";
  };
};

// SOURCE
const srcButton = document.getElementById('source');
srcButton.addEventListener('click', function (event) {
    ipcRenderer.send('open:source')
});
ipcRenderer.on('chosen:source', function (event, path) {
  srcPath = path;
  //passing sourcePath and callback function
  var dirArray = fs.readdirSync(srcPath);
  createImageObjects(dirArray, srcPath).then(function () {createFolders(imageArray.sort((a, b) => b.date - a.date))});
  // NOTIFICAITON: 
  if (dirArray.length === 0) {
    ChangeTitle('Invalid Source');
    ChangeButtonStatus(document.getElementById('source-wrapper'), false);
  }
  else {
    ChangeTitle();
    ChangeButtonStatus(document.getElementById('source-wrapper'),true);
    const myNotification = new Notification('Source Loaded', {
      body: 'Source path set succesfully'
    });
  }
});

// OUTPUT
const outButton = document.getElementById('output');
outButton.addEventListener('click', function (event) {
    ipcRenderer.send('open:output')
});

ipcRenderer.on('chosen:output', function (event, path) {
  outPath = path;
  console.log('Full OUTPUT path: ', path);
  // NOTIFICAITON:  
  if (outPath === undefined) {
    ChangeTitle('Invalid Input');
    ChangeButtonStatus(document.getElementById('output-wrapper'), false);
  }
  else {
    ChangeTitle();
    ChangeButtonStatus(document.getElementById('output-wrapper'), true);

    const myNotification = new Notification('Output Loaded', {
      body: 'Output path set succesfully'
    });
  }

});


// SELECT
document.body.onmousedown = function(e) { 
  if (e.target.classList.value === "folder-img") {
    const folder = e.target;
    console.log(folder);
    if(!selectedFolders.includes(folder)){          //checking weather array contain the id
      selectedFolders.push(folder);               //adding to array because value doesnt exists
    }else{
        selectedFolders.splice(selectedFolders.indexOf(folder), 1);  //deleting
        folder.style.filter = "none";
    }
    for (var i = 0; i < selectedFolders.length; i++) {
      selectedFolders[i].style.filter = "drop-shadow(0 0 5px #474787)";
    };
    var selectedCount = document.getElementsByClassName('selected-count');
    Array.prototype.forEach.call(selectedCount, function(p) {
      p.innerHTML = ('000' + selectedFolders.length).substr(-3);
    });
  };
};


// GROUP
const groupButton = document.getElementById('group');
groupIndex = 1;
groupButton.addEventListener('click', function (event) {
  if (selectedFolders.length === 0) {
    ChangeTitle('No Folders Selected');
  }
  else {
    var newImgArray = [];
    var folderId;
    selectedFolders.forEach(selectedFolder => {
      folderID = folderArray.findIndex(element => element.id == selectedFolder.id );
      folderArray[folderID].imageArray.forEach(image => {
        newImgArray.push(image);
      });
      folderArray.splice(folderID, 1);
      
    });
    var newFolder = new Folder;
    newFolder.name = 'New Groupe ' + groupIndex;
    groupIndex++;

    newFolder.imageArray = newImgArray
    newFolder.id = (folderArray.length)
    folderArray.push(newFolder);
    selectedFolders = [];
    resetFolderId(folderArray);
    displayFolders(folderArray);
  }
  var selectedCount = document.getElementsByClassName('selected-count');
  Array.prototype.forEach.call(selectedCount, function(p) {
    p.innerHTML = '000';
  });
  
});


// RENAME BUTTON
const renameButton = document.getElementById('rename');
renameButton.addEventListener('click', function (event) {
  var renameContainer = document.getElementById("rename-container");
  renameContainer.style.display = "flex";
  console.log(folderArray);
});

// RENAME SUBMIT
const renameSubmit = document.getElementById('rename-data');
renameSubmit.addEventListener('keyup', function (event) {
  if(event.code === 'Enter') {
    event.preventDefault();
    var renameContainer = document.getElementById("rename-container");
    var renameData = document.getElementById("rename-data").value;

    if (selectedFolders.length === 0){
      ChangeTitle('No Selection');
    }
    else if (selectedFolders.length === 1) {
      folderArray[selectedFolders[0].id].name = renameData; 
    }
    else {
      var renameID = 1;
      selectedFolders.forEach(selectedFolder => {
        folderArray[selectedFolder.id].name = renameData + renameID;
        renameID++;
      });
    }
    displayFolders(folderArray);
    renameContainer.style.display = "none";
    selectedFolders= [];
    var selectedCount = document.getElementsByClassName('selected-count');
    Array.prototype.forEach.call(selectedCount, function(p) {
      p.innerHTML = '000';
    });
  };
});


// ORGANIZE
const organiseButton = document.getElementById('organise');
organiseButton.addEventListener('click', function (event) {
  if ( srcPath === undefined){
    ChangeTitle('Source Needed');
  }
  else if ( outPath === undefined) {
    ChangeTitle('Output Needed');
    document.getElementById('title-shown').innerHTML = title;
  }
  else {
    for (var folderIndex=0 ; folderIndex < folderArray.length; folderIndex++) {
      for (var imageIndex=0 ; imageIndex < folderArray[folderIndex].imageArray.length ;  imageIndex++) {
        var oldPath = folderArray[folderIndex].imageArray[imageIndex].sourcePath;
        var newPath = outPath + "/" + folderArray[folderIndex].name + "/" + folderArray[folderIndex].imageArray[imageIndex].name;

        if (!fs.existsSync(outPath + "/" + folderArray[folderIndex].name)){
          fs.mkdirSync(outPath + "/" + folderArray[folderIndex].name);
        }

        fs.copyFile(oldPath, newPath, function (err) {
          if (err) throw err
        });
      }
    };

    const folderList = document.getElementById("folder-list");
    folderList.innerHTML = "";
    // NOTIFICAITON: 
    const myNotification = new Notification('Organised!', {
      body: 'Photos were succesfully organised'
    });
  }
  selectedFolders= [];
});


// CONSTRUCTOR FOR Image CLASS
// ////////////////////////////////////////////////////////////////////////////////////////////////////
class Image {
    constructor(name, date, sourcePath, index) {
      this.name = name;
      this.sourcePath = sourcePath;
      this.date = date;
      this.index = index;
    };
};

// CREATE IMAGE OBJECTS 
async function createImageObjects(dirArray, srcPath) {
    imageArray = []; // Reset if srcPath changes
    // post condition: appends only images to imageArray.
    // for loop to allow await and then.
    for (var i = 0; i < dirArray.length; i++) { // forEach(function(value, index))
        // SPECIFY ACCEPTED FILE FORMATS
        if (dirArray[i].match(/.(jpg|jpeg|png|gif|arw|raw|tif|svg)$/i)){
            // await response of exifr before continuing loop.
            var date = await exifr.parse( path.join(srcPath, dirArray[i]), ['DateTimeOriginal'] )
            // convert date format to string format.
            if ( date === undefined ) {
              dateTime = "Unknown";
            }
            else {
              dateTime = (date.DateTimeOriginal.toISOString()).slice(0,10);
            }
            // set output path to src path just incase they click organise by accident. Check for equality and prompt error.
            var image = new Image(dirArray[i], dateTime, path.join(srcPath, dirArray[i]), i);
            // append to imageArray
            imageArray.push(image);
        };
    };
};

// DISPLAY CONTENTS OF imageArray
function logImages (imageArray) {
  imageArray.forEach(function(image) {
      console.log('name: ' + image.name  +  ', sourcePath: '  + image.sourcePath +  ', date: '  + image.date + ', index: ' + image.index);
  }); 
};

function logFolders (folderArray) {
  folderArray.forEach(function(folder) {
      console.log('name: ' + folder.name  +  ', id: '  + folder.id  + ', array: ' + folder.imageArray);
  }); 
};


// /////////////////////////////////////////////////////////////////////////////////////////
// FOLDERS
// document.addEventListener('DOMContentLoaded', getFolders);

class Folder {
  constructor(name, images, id) {
    this.name = name;
    this.imageArray = images;
    this.id = id;
  };
};

function createFolders(imageArray){
  // redifined incase new srcPath chosen.
  var folderID = 0;
  folderArray = [];
  // for loop to allow await and then.
  for (var i = 0; i < imageArray.length; i++) { // forEach(function(value, index))
    // If folder with name of imageArray[i].date already exists
    if ( folderArray.some(x => x.name.includes(imageArray[i].date))) {
      // SELECT the folder with matching name of imageArray[i].date
      let folder = folderArray.find(obj => obj.name == imageArray[i].date);
      // PUSH THE IMAGE TO THE IMAGE ARRAY OF THE SELECTED FOLDER
      folder.imageArray.push(imageArray[i]);
    }
    else {
      // parameter two: passing array with image included inside.
      let folder = new Folder(imageArray[i].date, [imageArray[i]], folderID);
      folderArray.push(folder);
      folderID++;
    }
  }
  displayFolders(folderArray);
};

function displayFolders(folderArray) {
  // RESET THE HTML FOR THE FOLDER LIST CONTAINING ALL APPENDED FOLDERS
  const folderList = document.getElementById("folder-list");
  // Reset folders
  folderList.innerHTML = "";
  folderArray.forEach( (folder) => {
    // FOLDER CONTAINER DIV
    const folderListContainerDiv = document.createElement("div");
    folderListContainerDiv.classList.add("folder-container")
    // FOLDER DIV
    const folderDiv = document.createElement("div");
    folderDiv.classList.add("folder");
    folderListContainerDiv.appendChild(folderDiv);
    // FOLDER IMG
    const folderImg = document.createElement('img');
    folderImg.src = folderImgSource;
    folderImg.classList.add("folder-img");
    folderImg.setAttribute("id", folder.id);
    folderDiv.appendChild(folderImg);
    // FOLDER SIZE
    const folderSize = document.createElement('p');
    folderSize.classList.add("folder-size");
    folderSize.innerHTML = folder.imageArray.length;
    folderSize.style.color = folderSizeColors[0];
    // folderSize.style.backgroundColor = folderSizeColors[1];
    folderDiv.appendChild(folderSize);
    // FOLDER DATE
    const folderName = document.createElement('p');
    folderName.classList.add("folder-name");
    folderName.innerHTML = folder.name;
    folderDiv.appendChild(folderName);
    // APPEND FOLDER DIV TO FOLDER-ITEM DIV( container div)
    folderList.appendChild(folderListContainerDiv);
  });
  updateConsole(imageArray, folderArray);
};

// CONSOLE STATS
function updateConsole(imageArray, folderArray) {
  var photoCount = document.getElementById('photo-count');
  var folderCount = document.getElementById('folder-count');
  
  photoCount.innerHTML = ('000' + imageArray.length).substr(-3);
  folderCount.innerHTML = ('000' + folderArray.length).substr(-3);
};


function resetFolderId (folderArray) {
  for (var i = 0; i < folderArray.length; i++) {
    folderArray[i].id = i;
  };
};






