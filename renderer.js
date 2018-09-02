// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var $ = require('jquery');
window.$ = $;
require('bootstrap');
var fs = require('fs');
var crypto = require('crypto');

//All servers can be added here, but I'm lazy and only need these two.
//Format is DisplayText:ConfigCode where the ConfigCode is what the
//League of Legends configs refer to the server by.
const SERVERS = {
  "North America":"NA",
  "Latin America North":"LA1",
}
const LEAGUE_OF_LEGENDS_ROOT = "C:/Riot Games/League of Legends/Config";
const PATH_TO_BACKUP_SETTINGS = "C:/Riot Games/League of Legends/Config/RitoPls";
const MAPPING_FILE_NAME = "Profiles.json";
const PERSISTED_SETTINGS_JSON = "PersistedSettings.json";
const BACKUP_JSON_NAME = "PersistedSettingsBackup.json";
const REGION_SETTINGS_FILE = "LeagueClientSettings.yaml";

var known_profiles = {};
//Objects should be: 'md5hash':'Name'

function load_initial_app_state(){
  //Set UI references
  var region_swap_selecter = $("#region_swap_select");
  var region_swap_button = $("#region_swap_button");
  var region_swap_text = $("#region_swap_text");

  var settings_save_button = $("#settings_save_button");
  var settings_save_text = $("#settings_save_text");
  var settings_selected_text = $("#settings_selected_text");

  var settings_load_button = $("#settings_load_button");
  var settings_load_select = $("#settings_load_select");

  //Bind UI Actions
  region_swap_button.click(set_region);
  settings_save_button.click(create_profile);
  settings_load_button.click(load_profile);

  //Create required directories if they don't exist
  if (!fs.existsSync(PATH_TO_BACKUP_SETTINGS)){
    fs.mkdirSync(PATH_TO_BACKUP_SETTINGS);
  }

  //Input all known servers (in the constant SERVERS) to the dropdown
  for (var key in SERVERS){
    region_swap_selecter.append($("<option/>", {
      value: SERVERS[key],
      text: key
    }));
  }

  //Get current server and update the UI
  var key = get_current_region(get_league_client_settings());
  region_swap_selecter.val(SERVERS[key]);
  region_swap_text.text(key);

  //Get current hash of Persisted Settings
  var current_profile = get_persisted_settings();
  var current_profile_hash = get_persisted_settings_hash(current_profile);

  //Load known settings from JSON
  try {
    known_profiles = get_known_profiles();
  } catch (err) {
    console.log("Failed to load profiles.");
    console.log(err);
    known_profiles = {};
  }

  //Match current profile if one is saved
  current_profile = known_profiles[current_profile_hash];
  if (current_profile == undefined){
    current_profile = "Unknown";
  }
  settings_selected_text.text(current_profile);

  //Display known profiles
  for (var md5 in known_profiles){
    settings_load_select.append($("<option/>", {
      value: md5,
      text: known_profiles[md5]
    }));
  }
}

function load_profile(){
  var value = $("#settings_load_select").val();
  var name = known_profiles[value];
  var target = PATH_TO_BACKUP_SETTINGS+"/"+name+".prof";
  var contents = get_file_contents(target);

  set_persisted_settings(contents);
}

function create_profile(){
  //Note: No error handling on this
  var name = $("#settings_save_text").val();
  var prof = get_persisted_settings();
  var hash = get_persisted_settings_hash(prof);

  var file_loc = PATH_TO_BACKUP_SETTINGS+"/"+name+".prof";

  set_file_contents(file_loc, prof);

  known_profiles[hash] = name;

  save_known_profiles();

  $("#settings_load_select").append($("<option/>", {
    value: hash,
    text: name
  }));

  $("#settings_save_text").val("");
  $("#settings_selected_text").val(name);
}

function get_current_region(region_file_contents){
  for (var key in SERVERS){
    var containsString = "region: \""+SERVERS[key]+"\"";
    if (region_file_contents.includes(containsString)){
      //console.log("Current key is: ", key);
      return key;
    }
  }
}
function set_region(){
  var client_settings = get_league_client_settings();
  var current_region = get_current_region(client_settings);
  var new_region = $("#region_swap_select").val();

  //console.log("Setting new region to value: ", new_region);

  var stringToReplace = "region: \""+SERVERS[current_region]+"\"";
  var resultingString = "region: \""+new_region+"\"";
  client_settings = client_settings.replace(stringToReplace, resultingString);

  set_league_client_settings(client_settings);

  //Update the UI
  for (var key in SERVERS){
    if (SERVERS[key] == new_region){
      $("#region_swap_text").text(key);
    }
  }
}

function get_known_profiles(){
  var target = PATH_TO_BACKUP_SETTINGS+"/"+MAPPING_FILE_NAME;
  var json = get_file_contents(target);
  return JSON.parse(json);
}

function save_known_profiles(){
  var target = PATH_TO_BACKUP_SETTINGS+"/"+MAPPING_FILE_NAME;
  var json = JSON.stringify(known_profiles);
  set_file_contents(target, json);
}

function get_persisted_settings_hash(persisted_settings_contents){
  return crypto.createHash('md5').update(persisted_settings_contents).digest('hex');
}

function get_persisted_settings(){
  var target = LEAGUE_OF_LEGENDS_ROOT+"/"+PERSISTED_SETTINGS_JSON;
  return get_file_contents(target);
}

function get_league_client_settings(){
  var target = LEAGUE_OF_LEGENDS_ROOT+"/"+REGION_SETTINGS_FILE;
  return get_file_contents(target);
}

function set_league_client_settings(updated){
  var target = LEAGUE_OF_LEGENDS_ROOT+"/"+REGION_SETTINGS_FILE;
  set_file_contents(target, updated);
}

function set_persisted_settings(updated){
  var target = LEAGUE_OF_LEGENDS_ROOT+"/"+PERSISTED_SETTINGS_JSON;
  set_file_contents(target, updated);
}

function get_file_contents(fileLocation){
  return fs.readFileSync(fileLocation, "utf8");
}

function set_file_contents(fileLocation, contents){
  fs.writeFileSync(fileLocation, contents);
}

load_initial_app_state();
