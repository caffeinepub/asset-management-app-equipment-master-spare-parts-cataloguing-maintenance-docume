import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import File "blob-storage/Storage";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import VarArray "mo:core/VarArray";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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

  module Equipment {
    public func compare(e1 : Equipment, e2 : Equipment) : Order.Order {
      Nat.compare(e1.equipmentNumber, e2.equipmentNumber);
    };
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

  module SparePart {
    public func compareByEquipmentNumber(s1 : SparePart, s2 : SparePart) : Order.Order {
      Nat.compare(s1.equipmentNumber, s2.equipmentNumber);
    };
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

  public query ({ caller }) func getNextEquipmentNumber() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view next equipment number");
    };
    nextEquipmentNumber;
  };

  public shared ({ caller }) func createEquipment(
    name : Text,
    equipmentTagNumber : Text,
    location : Text,
    manufacturer : Text,
    model : Text,
    serial : Text,
    purchase : Time.Time,
    warranty : Time.Time,
    additionalInfo : Text,
    discipline : EngineeringDiscipline,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create equipment");
    };

    let equipment : Equipment = {
      equipmentNumber = nextEquipmentNumber;
      equipmentTagNumber;
      name;
      location;
      manufacturer;
      model;
      serialNumber = serial;
      purchaseDate = purchase;
      warrantyExpiry = warranty;
      additionalInformation = additionalInfo;
      discipline;
    };
    equipmentMap.add(nextEquipmentNumber, equipment);
    nextEquipmentNumber += 1;
    equipment.equipmentNumber;
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
    equipmentMap.values().toArray().sort();
  };

  public shared ({ caller }) func updateEquipment(
    equipmentNumber : Nat,
    name : Text,
    equipmentTagNumber : Text,
    location : Text,
    manufacturer : Text,
    model : Text,
    serial : Text,
    purchase : Time.Time,
    warranty : Time.Time,
    additionalInfo : Text,
    discipline : EngineeringDiscipline,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update equipment");
    };

    switch (equipmentMap.get(equipmentNumber)) {
      case (null) { false };
      case (?_existing) {
        let updatedEquipment : Equipment = {
          equipmentNumber;
          equipmentTagNumber;
          name;
          location;
          manufacturer;
          model;
          serialNumber = serial;
          purchaseDate = purchase;
          warrantyExpiry = warranty;
          additionalInformation = additionalInfo;
          discipline;
        };
        equipmentMap.add(equipmentNumber, updatedEquipment);
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
      case (?_existing) {
        equipmentMap.remove(equipmentNumber);
        sparePartsMap.remove(equipmentNumber);
        cataloguingMap.remove(equipmentNumber);
        maintenanceMap.remove(equipmentNumber);
        documentMap.remove(equipmentNumber);
        true;
      };
    };
  };

  public shared ({ caller }) func createSparePart(
    equipmentNumber : Nat,
    name : Text,
    description : Text,
    quantity : Nat,
    supplier : Text,
    manufacturer : Text,
    partNo : Text,
    modelSerial : Text,
    attachment : ?File.ExternalBlob,
    additionalInfo : Text,
  ) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create spare parts");
    };

    if (not equipmentMap.containsKey(equipmentNumber)) {
      return null;
    };

    let part : SparePart = {
      partNumber = nextPartNumber;
      equipmentNumber;
      name;
      description;
      quantity;
      supplier;
      manufacturer;
      partNo;
      modelSerial;
      attachment;
      additionalInformation = additionalInfo;
    };

    let existingParts = switch (sparePartsMap.get(equipmentNumber)) {
      case (null) { List.empty<SparePart>() };
      case (?parts) { parts };
    };

    existingParts.add(part);
    sparePartsMap.add(equipmentNumber, existingParts);
    nextPartNumber += 1;
    ?part.partNumber;
  };

  public query ({ caller }) func getSparePartsByEquipment(equipmentNumber : Nat) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spare parts");
    };

    switch (sparePartsMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?parts) { parts.toArray() };
    };
  };

  public shared ({ caller }) func updateSparePart(
    equipmentNumber : Nat,
    partNumber : Nat,
    name : Text,
    description : Text,
    quantity : Nat,
    supplier : Text,
    manufacturer : Text,
    partNo : Text,
    modelSerial : Text,
    attachment : ?File.ExternalBlob,
    additionalInfo : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update spare parts");
    };

    switch (sparePartsMap.get(equipmentNumber)) {
      case (null) { false };
      case (?parts) {
        let updatedParts = parts.map<SparePart, SparePart>(
          func(p) {
            if (p.partNumber == partNumber) {
              {
                partNumber;
                equipmentNumber;
                name;
                description;
                quantity;
                supplier;
                manufacturer;
                partNo;
                modelSerial;
                attachment;
                additionalInformation = additionalInfo;
              };
            } else {
              p;
            };
          }
        );
        sparePartsMap.add(equipmentNumber, updatedParts);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteSparePart(equipmentNumber : Nat, partNumber : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete spare parts");
    };

    switch (sparePartsMap.get(equipmentNumber)) {
      case (null) { false };
      case (?parts) {
        let filteredParts = parts.filter(
          func(p) { p.partNumber != partNumber }
        );
        sparePartsMap.add(equipmentNumber, filteredParts);
        true;
      };
    };
  };

  public query ({ caller }) func findSparePartsByEquipmentTagNumber(_equipmentTagNumber : Text) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search spare parts");
    };

    switch (sparePartsMap.get(0)) {
      case (null) { [] };
      case (?parts) { parts.toArray() };
    };
  };

  public query ({ caller }) func findSparePartsByModelSerial(modelSerial : Text) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search spare parts");
    };

    let result = List.empty<SparePart>();
    let allEntries = sparePartsMap.entries().toArray();

    for ((_, parts) in allEntries.values()) {
      for (part in parts.values()) {
        if (part.modelSerial.contains(#text modelSerial)) {
          result.add(part);
        };
      };
    };

    result.toArray();
  };

  public query ({ caller }) func findSparePartsByPartNo(partNo : Text) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search spare parts");
    };

    let result = List.empty<SparePart>();
    let allEntries = sparePartsMap.entries().toArray();

    for ((_, parts) in allEntries.values()) {
      for (part in parts.values()) {
        if (part.partNo.contains(#text partNo)) {
          result.add(part);
        };
      };
    };

    result.toArray();
  };

  public query ({ caller }) func findSparePartsByManufacturer(manufacturer : Text) : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search spare parts");
    };

    let result = List.empty<SparePart>();
    let allEntries = sparePartsMap.entries().toArray();

    for ((_, parts) in allEntries.values()) {
      for (part in parts.values()) {
        if (part.manufacturer.contains(#text manufacturer)) {
          result.add(part);
        };
      };
    };

    result.toArray();
  };

  public shared ({ caller }) func createCataloguingRecord(
    equipmentNumber : Nat,
    materialDesc : Text,
    templateName : Text,
    attributes : [(Text, Text)],
    isDraft : Bool,
    additionalInfo : Text,
  ) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cataloguing records");
    };

    if (not equipmentMap.containsKey(equipmentNumber)) {
      return null;
    };

    let record : CataloguingRecord = {
      equipmentNumber;
      materialDescription = materialDesc;
      templateName;
      attributes;
      status = if (isDraft) { #draft } else { #submitted };
      additionalInformation = additionalInfo;
    };

    let existingRecords = switch (cataloguingMap.get(equipmentNumber)) {
      case (null) { List.empty<CataloguingRecord>() };
      case (?records) { records };
    };

    existingRecords.add(record);
    cataloguingMap.add(equipmentNumber, existingRecords);
    ?equipmentNumber;
  };

  public query ({ caller }) func getCataloguingRecordsByEquipment(equipmentNumber : Nat) : async [CataloguingRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cataloguing records");
    };

    switch (cataloguingMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  public shared ({ caller }) func updateCataloguingRecord(
    equipmentNumber : Nat,
    recordIndex : Nat,
    materialDesc : Text,
    templateName : Text,
    attributes : [(Text, Text)],
    isDraft : Bool,
    additionalInfo : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cataloguing records");
    };

    switch (cataloguingMap.get(equipmentNumber)) {
      case (null) { false };
      case (?records) {
        let allRecords = records.toArray();
        if (recordIndex >= allRecords.size()) {
          return false;
        };

        let updatedRecord : CataloguingRecord = {
          equipmentNumber;
          materialDescription = materialDesc;
          templateName;
          attributes;
          status = if (isDraft) { #draft } else { #submitted };
          additionalInformation = additionalInfo;
        };

        let updatedRecords = List.empty<CataloguingRecord>();
        var i = 0;
        for (record in allRecords.values()) {
          if (i == recordIndex) {
            updatedRecords.add(updatedRecord);
          } else {
            updatedRecords.add(record);
          };
          i += 1;
        };

        cataloguingMap.add(equipmentNumber, updatedRecords);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteCataloguingRecord(equipmentNumber : Nat, recordIndex : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cataloguing records");
    };

    switch (cataloguingMap.get(equipmentNumber)) {
      case (null) { false };
      case (?records) {
        let allRecords = records.toArray();
        if (recordIndex >= allRecords.size()) {
          return false;
        };

        let updatedRecords = List.empty<CataloguingRecord>();
        var i = 0;
        for (record in allRecords.values()) {
          if (i != recordIndex) {
            updatedRecords.add(record);
          };
          i += 1;
        };

        cataloguingMap.add(equipmentNumber, updatedRecords);
        true;
      };
    };
  };

  public shared ({ caller }) func createMaintenanceRecord(
    equipmentNumber : Nat,
    maintType : Text,
    status : { #scheduled; #completed; #overdue },
    lastDate : Time.Time,
    nextDate : Time.Time,
    additionalInfo : Text,
  ) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create maintenance records");
    };

    if (not equipmentMap.containsKey(equipmentNumber)) {
      return null;
    };

    let record : MaintenanceRecord = {
      maintenanceId = nextMaintenanceId;
      equipmentNumber;
      maintenanceType = maintType;
      maintenanceStatus = status;
      lastMaintenanceDate = lastDate;
      nextMaintenanceDate = nextDate;
      additionalInformation = additionalInfo;
    };

    let existingRecords = switch (maintenanceMap.get(equipmentNumber)) {
      case (null) { List.empty<MaintenanceRecord>() };
      case (?records) { records };
    };

    existingRecords.add(record);
    maintenanceMap.add(equipmentNumber, existingRecords);
    nextMaintenanceId += 1;
    ?record.maintenanceId;
  };

  public query ({ caller }) func getMaintenanceByEquipment(equipmentNumber : Nat) : async [MaintenanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance records");
    };

    switch (maintenanceMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?records) { records.toArray() };
    };
  };

  public shared ({ caller }) func updateMaintenanceRecord(
    equipmentNumber : Nat,
    maintenanceId : Nat,
    maintType : Text,
    status : { #scheduled; #completed; #overdue },
    lastDate : Time.Time,
    nextDate : Time.Time,
    additionalInfo : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update maintenance records");
    };

    switch (maintenanceMap.get(equipmentNumber)) {
      case (null) { false };
      case (?records) {
        let updatedRecords = records.map<MaintenanceRecord, MaintenanceRecord>(
          func(record) {
            if (record.maintenanceId == maintenanceId) {
              {
                maintenanceId;
                equipmentNumber;
                maintenanceType = maintType;
                maintenanceStatus = status;
                lastMaintenanceDate = lastDate;
                nextMaintenanceDate = nextDate;
                additionalInformation = additionalInfo;
              };
            } else {
              record;
            };
          }
        );
        maintenanceMap.add(equipmentNumber, updatedRecords);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteMaintenanceRecord(equipmentNumber : Nat, maintenanceId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete maintenance records");
    };

    switch (maintenanceMap.get(equipmentNumber)) {
      case (null) { false };
      case (?records) {
        let filteredRecords = records.filter(
          func(record) { record.maintenanceId != maintenanceId }
        );
        maintenanceMap.add(equipmentNumber, filteredRecords);
        true;
      };
    };
  };

  public shared ({ caller }) func uploadDocument(
    equipmentNumber : Nat,
    docType : Text,
    file : File.ExternalBlob,
    additionalInfo : Text,
  ) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload documents");
    };

    if (not equipmentMap.containsKey(equipmentNumber)) {
      return null;
    };

    let doc : Document = {
      docId = nextDocId;
      equipmentNumber;
      documentType = docType;
      uploadDate = Time.now();
      filePath = file;
      additionalInformation = additionalInfo;
    };

    let existingDocs = switch (documentMap.get(equipmentNumber)) {
      case (null) { List.empty<Document>() };
      case (?docs) { docs };
    };

    existingDocs.add(doc);
    documentMap.add(equipmentNumber, existingDocs);
    nextDocId += 1;
    ?doc.docId;
  };

  public query ({ caller }) func getDocumentsByEquipment(equipmentNumber : Nat) : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view documents");
    };

    switch (documentMap.get(equipmentNumber)) {
      case (null) { [] };
      case (?docs) { docs.toArray() };
    };
  };

  public shared ({ caller }) func deleteDocument(equipmentNumber : Nat, docId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete documents");
    };

    switch (documentMap.get(equipmentNumber)) {
      case (null) { false };
      case (?docs) {
        let filteredDocs = docs.filter(
          func(doc) { doc.docId != docId }
        );
        documentMap.add(equipmentNumber, filteredDocs);
        true;
      };
    };
  };

  public shared ({ caller }) func updateDocumentMetadata(
    equipmentNumber : Nat,
    docId : Nat,
    newDocType : Text,
    additionalInfo : Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update document metadata");
    };

    switch (documentMap.get(equipmentNumber)) {
      case (null) { false };
      case (?docs) {
        let updatedDocs = docs.map<Document, Document>(
          func(doc) {
            if (doc.docId == docId) {
              {
                doc with documentType = newDocType; additionalInformation = additionalInfo;
              };
            } else {
              doc;
            };
          }
        );
        documentMap.add(equipmentNumber, updatedDocs);
        true;
      };
    };
  };

  public query ({ caller }) func getEquipmentList() : async [Equipment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view equipment list");
    };
    equipmentMap.values().toArray().sort();
  };

  public query ({ caller }) func getSparePartsReport() : async [SparePart] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spare parts report");
    };

    sparePartsMap.entries().flatMap<((Nat, List.List<SparePart>)), SparePart>(
      func(entry) {
        let (equipmentNumber, parts) = entry;
        parts.values();
      }
    ).toArray<SparePart>().sort(SparePart.compareByEquipmentNumber);
  };

  public query ({ caller }) func getMaintenanceDueReport() : async [MaintenanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view maintenance due report");
    };

    let allRecords = maintenanceMap.entries().flatMap(
      func(entry) {
        let (eqNum, records) = entry;
        records.values();
      }
    ).toArray();

    allRecords.filter(
      func(record) { switch (record.maintenanceStatus) { case (#overdue) { true }; case (_) { false } } }
    );
  };
};
