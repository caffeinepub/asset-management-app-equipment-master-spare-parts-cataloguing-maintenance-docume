import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import File "blob-storage/Storage";
import Text "mo:core/Text";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  public type UserProfile = {
    name : Text;
    department : Text;
  };

  public type EngineeringDiscipline = {
    #mechanical;
    #electrical;
    #instrumentation;
    #piping;
    #unknown;
  };

  public type Equipment = {
    equipmentNumber : Nat;
    equipmentTagNumber : Text;
    name : Text;
    location : Text;
    manufacturer : Text;
    model : Text;
    serialNumber : Text;
    purchaseDate : Time.Time;
    warrantyExpiry : Time.Time;
    additionalInformation : Text;
    discipline : EngineeringDiscipline;
  };

  public type SparePart = {
    partNumber : Nat;
    name : Text;
    description : Text;
    quantity : Nat;
    supplier : Text;
    manufacturer : Text;
    manufacturerPartNo : Text;
    modelSerial : Text;
    attachment : ?File.ExternalBlob;
    additionalInformation : Text;
  };

  public type CataloguingRecord = {
    equipmentNumber : Nat;
    materialDescription : Text;
    templateName : Text;
    attributes : [(Text, Text)];
    status : { #draft; #submitted };
    additionalInformation : Text;
  };

  public type MaintenanceRecord = {
    maintenanceId : Nat;
    equipmentNumber : Nat;
    maintenanceType : Text;
    maintenanceStatus : { #scheduled; #completed; #overdue };
    lastMaintenanceDate : Time.Time;
    nextMaintenanceDate : Time.Time;
    additionalInformation : Text;
  };

  public type Document = {
    docId : Nat;
    equipmentNumber : Nat;
    documentType : Text;
    uploadDate : Time.Time;
    filePath : File.ExternalBlob;
    additionalInformation : Text;
  };

  var nextEquipmentNumber : Nat = 1;
  var nextPartNumber : Nat = 1;
  var nextMaintenanceId : Nat = 1;
  var nextDocId : Nat = 1;

  let equipmentMap = Map.empty<Nat, Equipment>();
  let sparePartsMap = Map.empty<Nat, SparePart>();
  let equipmentSparePartsMap = Map.empty<Nat, List.List<Nat>>();
  let cataloguingMap = Map.empty<Nat, List.List<CataloguingRecord>>();
  let maintenanceMap = Map.empty<Nat, List.List<MaintenanceRecord>>();
  let documentMap = Map.empty<Nat, List.List<Document>>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();

  func engineeringDisciplineToText(discipline : EngineeringDiscipline) : Text {
    switch (discipline) {
      case (#mechanical) { "MECHANICAL" };
      case (#electrical) { "ELECTRICAL" };
      case (#instrumentation) { "INSTRUMENTATION" };
      case (#piping) { "PIPING" };
      case (#unknown) { "UNKNOWN" };
    };
  };

  func textToEngineeringDiscipline(text : Text) : EngineeringDiscipline {
    switch (text) {
      case ("MECHANICAL") { #mechanical };
      case ("ELECTRICAL") { #electrical };
      case ("INSTRUMENTATION") { #instrumentation };
      case ("PIPING") { #piping };
      case (_) { #unknown };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createEquipment(equipment : Equipment) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create equipment");
    };

    switch (equipmentMap.get(equipment.equipmentNumber)) {
      case (?_) {
        Runtime.trap(
          "Error: Equipment with number already exists (equipmentNumber = " # debug_show(equipment.equipmentNumber) # ")"
        );
      };
      case (null) {
        let existingTagNumber = equipmentMap.toArray().find(
          func((_, eq)) {
            eq.equipmentTagNumber == equipment.equipmentTagNumber;
          }
        );
        if (existingTagNumber != null) {
          Runtime.trap(
            "Error: Equipment with tag no " # equipment.equipmentTagNumber # " already exists"
          );
        };
        equipmentMap.add(equipment.equipmentNumber, equipment);
        true;
      };
    };
  };

  public shared ({ caller }) func createSparePart(part : SparePart) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create spare parts");
    };

    switch (sparePartsMap.get(part.partNumber)) {
      case (?_) {
        Runtime.trap(
          "Error: Spare part with part number already exists (partNumber = " # debug_show(part.partNumber) # ")"
        );
      };
      case (null) {
        let existingManufacturerPartNo = sparePartsMap.toArray().find(
          func((_, sp)) {
            sp.manufacturerPartNo == part.manufacturerPartNo;
          }
        );
        if (existingManufacturerPartNo != null) {
          Runtime.trap(
            "Error: Spare part with manufacturer part no " # part.manufacturerPartNo # " already exists"
          );
        };
        sparePartsMap.add(part.partNumber, part);
        true;
      };
    };
  };

  public query ({ caller }) func findEquipmentByMatching(
    searchTerm : Text,
    matchEquipmentNumber : Bool,
    matchEquipmentTagNumber : Bool,
    matchName : Bool,
    matchModel : Bool,
    matchSerialNumber : Bool,
  ) : async [Equipment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search equipment");
    };

    let lowerCaseTerm = searchTerm.toLower();

    let foundEntries = equipmentMap.toArray().filter(
      func((_, equipment)) : Bool {
        let tagNumberMatches = if (matchEquipmentTagNumber) {
          equipment.equipmentTagNumber.toLower().contains(#text lowerCaseTerm);
        } else { false };
        let nameMatches = if (matchName) {
          equipment.name.toLower().contains(#text lowerCaseTerm);
        } else { false };
        let modelMatches = if (matchModel) {
          equipment.model.toLower().contains(#text lowerCaseTerm);
        } else { false };
        let serialNumberMatches = if (matchSerialNumber) {
          equipment.serialNumber.toLower().contains(#text lowerCaseTerm);
        } else { false };
        tagNumberMatches or nameMatches or modelMatches or serialNumberMatches;
      }
    );

    foundEntries.map(func((_, equipment)) { equipment });
  };

  public query ({ caller }) func findSparePartByMatching(
    searchTerm : Text,
    matchManufacturerPartNo : Bool,
    matchName : Bool,
    matchDescription : Bool,
  ) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search spare parts");
    };

    let lowerCaseTerm = searchTerm.toLower();

    let foundEntries = sparePartsMap.toArray().filter(
      func((_, sparePart)) : Bool {
        let manufacturerPartNoMatches = if (matchManufacturerPartNo) {
          sparePart.manufacturerPartNo.toLower().contains(#text lowerCaseTerm);
        } else { false };
        let nameMatches = if (matchName) {
          sparePart.name.toLower().contains(#text lowerCaseTerm);
        } else { false };
        let descriptionMatches = if (matchDescription) {
          sparePart.description.toLower().contains(#text lowerCaseTerm);
        } else { false };
        manufacturerPartNoMatches or nameMatches or descriptionMatches;
      }
    );

    foundEntries.map(func((_, sparePart)) { sparePart });
  };

  public query ({ caller }) func getAllEquipment() : async [Equipment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view equipment");
    };
    Array.fromIter(equipmentMap.values());
  };

  public query ({ caller }) func getEquipment(equipmentNumber : Nat) : async ?Equipment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view equipment");
    };
    equipmentMap.get(equipmentNumber);
  };

  public shared ({ caller }) func updateEquipment(equipment : Equipment) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update equipment");
    };
    switch (equipmentMap.get(equipment.equipmentNumber)) {
      case (null) { false };
      case (?_) {
        equipmentMap.add(equipment.equipmentNumber, equipment);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteEquipment(equipmentNumber : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete equipment");
    };
    switch (equipmentMap.get(equipmentNumber)) {
      case (null) { false };
      case (?_) {
        equipmentMap.remove(equipmentNumber);
        true;
      };
    };
  };

  public shared ({ caller }) func addOrUpdateSparePart(part : SparePart, equipmentNumber : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage spare parts");
    };

    switch (sparePartsMap.get(part.partNumber)) {
      case (null) {
        sparePartsMap.add(part.partNumber, part);
      };
      case (?_) {
        sparePartsMap.add(part.partNumber, part);
      };
    };

    let partNumbers = switch (equipmentSparePartsMap.get(equipmentNumber)) {
      case (null) { List.empty<Nat>() };
      case (?existingParts) { existingParts };
    };

    let partNumbersArray = partNumbers.toArray();
    let alreadyLinked = partNumbersArray.find(func(x) { x == part.partNumber });

    switch (alreadyLinked) {
      case (null) {
        partNumbers.add(part.partNumber);
        equipmentSparePartsMap.add(equipmentNumber, partNumbers);
      };
      case (?_) {};
    };

    true;
  };

  public shared ({ caller }) func unlinkSparePartFromEquipment(equipmentNumber : Nat, partNumber : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage spare parts");
    };

    switch (equipmentSparePartsMap.get(equipmentNumber)) {
      case (null) { false };
      case (?parts) {
        let filteredParts = parts.filter(
          func(p) { p != partNumber }
        );
        equipmentSparePartsMap.add(equipmentNumber, filteredParts);
        true;
      };
    };
  };

  public query ({ caller }) func getAllSpareParts() : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spare parts");
    };
    sparePartsMap.toArray().map(func((_, part)) { part });
  };

  public query ({ caller }) func getSparePartsForEquipment(equipmentNumber : Nat) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spare parts");
    };

    switch (equipmentSparePartsMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?partNumbers) {
        let partNumbersArray = partNumbers.toArray();
        partNumbersArray.map(
          func(partNumber) {
            switch (sparePartsMap.get(partNumber)) {
              case (null) {
                {
                  partNumber = 0;
                  name = "Unknown";
                  description = "";
                  quantity = 0;
                  supplier = "";
                  manufacturer = "";
                  manufacturerPartNo = "";
                  modelSerial = "";
                  attachment = null;
                  additionalInformation = "";
                };
              };
              case (?part) { part };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func deleteSparePartByPartNumber(partNumber : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete spare parts");
    };

    switch (sparePartsMap.get(partNumber)) {
      case (null) { false };
      case (?_) {
        sparePartsMap.remove(partNumber);
        true;
      };
    };
  };

  public query ({ caller }) func getAllCataloguingRecords(equipmentNumber : Nat) : async [CataloguingRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cataloguing records");
    };
    switch (cataloguingMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  public shared ({ caller }) func updateCataloguingRecord(record : CataloguingRecord) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cataloguing records");
    };
    switch (cataloguingMap.get(record.equipmentNumber)) {
      case (null) { false };
      case (?records) {
        let updatedRecords = records.map<CataloguingRecord, CataloguingRecord>(
          func(r : CataloguingRecord) : CataloguingRecord {
            if (r.materialDescription == record.materialDescription) { record } else { r };
          },
        );
        cataloguingMap.add(record.equipmentNumber, updatedRecords);
        true;
      };
    };
  };

  public query ({ caller }) func getAllMaintenanceRecords(equipmentNumber : Nat) : async [MaintenanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };
    switch (maintenanceMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  public shared ({ caller }) func updateMaintenanceRecord(record : MaintenanceRecord) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update maintenance records");
    };
    switch (maintenanceMap.get(record.equipmentNumber)) {
      case (null) { false };
      case (?records) {
        let updatedRecords = records.map<MaintenanceRecord, MaintenanceRecord>(
          func(r : MaintenanceRecord) : MaintenanceRecord {
            if (r.maintenanceId == record.maintenanceId) { record } else { r };
          },
        );
        maintenanceMap.add(record.equipmentNumber, updatedRecords);
        true;
      };
    };
  };

  public query ({ caller }) func getAllDocuments(equipmentNumber : Nat) : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view documents");
    };
    switch (documentMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?docs) { docs.toArray() };
    };
  };

  public shared ({ caller }) func deleteDocument(equipmentNumber : Nat, docId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete documents");
    };
    switch (documentMap.get(equipmentNumber)) {
      case (null) { false };
      case (?docs) {
        let filteredDocs = docs.filter(
          func(d : Document) : Bool { d.docId != docId },
        );
        documentMap.add(equipmentNumber, filteredDocs);
        true;
      };
    };
  };
};
