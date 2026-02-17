import Migration "migration";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import File "blob-storage/Storage";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

(with migration = Migration.run)
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
    equipmentNumber : Nat;
    name : Text;
    description : Text;
    quantity : Nat;
    supplier : Text;
    manufacturer : Text;
    partNo : Text;
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
  let sparePartsMap = Map.empty<Nat, List.List<SparePart>>();
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

  public query ({ caller }) func getEquipment(equipmentNumber : Nat) : async ?Equipment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view equipment");
    };
    equipmentMap.get(equipmentNumber);
  };

  public query ({ caller }) func getAllEquipment() : async [Equipment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view equipment");
    };
    Array.fromIter(equipmentMap.values());
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

  public query ({ caller }) func getSpareParts(equipmentNumber : Nat) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spare parts");
    };
    switch (sparePartsMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?parts) { parts.toArray() };
    };
  };

  public shared ({ caller }) func updateSparePart(part : SparePart) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update spare parts");
    };
    switch (sparePartsMap.get(part.equipmentNumber)) {
      case (null) { false };
      case (?parts) {
        let updatedParts = parts.map<SparePart, SparePart>(
          func(p : SparePart) : SparePart {
            if (p.partNumber == part.partNumber) { part } else { p };
          },
        );
        sparePartsMap.add(part.equipmentNumber, updatedParts);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteSparePart(equipmentNumber : Nat, partNumber : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete spare parts");
    };
    switch (sparePartsMap.get(equipmentNumber)) {
      case (null) { false };
      case (?parts) {
        let filteredParts = parts.filter(
          func(p : SparePart) : Bool { p.partNumber != partNumber },
        );
        sparePartsMap.add(equipmentNumber, filteredParts);
        true;
      };
    };
  };

  public query ({ caller }) func getCataloguingRecords(equipmentNumber : Nat) : async [CataloguingRecord] {
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

  public query ({ caller }) func getMaintenanceRecords(equipmentNumber : Nat) : async [MaintenanceRecord] {
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

  public query ({ caller }) func getDocuments(equipmentNumber : Nat) : async [Document] {
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
