import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import File "blob-storage/Storage";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  public type EngineeringDiscipline = {
    #mechanical;
    #electrical;
    #instrumentation;
    #piping;
    #unknown;
  };

  type NewActor = {
    equipmentMap : Map.Map<Nat, Equipment>;
    sparePartsMap : Map.Map<Nat, List.List<SparePart>>;
    cataloguingMap : Map.Map<Nat, List.List<CataloguingRecord>>;
    maintenanceMap : Map.Map<Nat, List.List<MaintenanceRecord>>;
    documentMap : Map.Map<Nat, List.List<Document>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextEquipmentNumber : Nat;
    nextPartNumber : Nat;
    nextMaintenanceId : Nat;
    nextDocId : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  type Equipment = {
    equipmentNumber : Nat;
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

  type SparePart = {
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

  type CataloguingRecord = {
    equipmentNumber : Nat;
    materialDescription : Text;
    templateName : Text;
    attributes : [(Text, Text)];
    status : { #draft; #submitted };
    additionalInformation : Text;
  };

  type MaintenanceRecord = {
    maintenanceId : Nat;
    equipmentNumber : Nat;
    maintenanceType : Text;
    maintenanceStatus : { #scheduled; #completed; #overdue };
    lastMaintenanceDate : Time.Time;
    nextMaintenanceDate : Time.Time;
    additionalInformation : Text;
  };

  type Document = {
    docId : Nat;
    equipmentNumber : Nat;
    documentType : Text;
    uploadDate : Time.Time;
    filePath : File.ExternalBlob;
    additionalInformation : Text;
  };

  public type UserProfile = {
    name : Text;
    department : Text;
  };

  type OldActor = {
    equipmentMap : Map.Map<Nat, OldEquipment>;
    sparePartsMap : Map.Map<Nat, List.List<OldSparePart>>;
    cataloguingMap : Map.Map<Nat, List.List<OldCataloguingRecord>>;
    maintenanceMap : Map.Map<Nat, List.List<OldMaintenanceRecord>>;
    documentMap : Map.Map<Nat, List.List<OldDocument>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextEquipmentNumber : Nat;
    nextPartNumber : Nat;
    nextMaintenanceId : Nat;
    nextDocId : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  type OldEquipment = {
    equipmentNumber : Nat;
    name : Text;
    location : Text;
    manufacturer : Text;
    model : Text;
    serialNumber : Text;
    purchaseDate : Time.Time;
    warrantyExpiry : Time.Time;
  };

  type OldSparePart = {
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
  };

  type OldCataloguingRecord = {
    equipmentNumber : Nat;
    materialDescription : Text;
    templateName : Text;
    attributes : [(Text, Text)];
    status : { #draft; #submitted };
  };

  type OldMaintenanceRecord = {
    maintenanceId : Nat;
    equipmentNumber : Nat;
    maintenanceType : Text;
    maintenanceStatus : { #scheduled; #completed; #overdue };
    lastMaintenanceDate : Time.Time;
    nextMaintenanceDate : Time.Time;
  };

  type OldDocument = {
    docId : Nat;
    equipmentNumber : Nat;
    documentType : Text;
    uploadDate : Time.Time;
    filePath : File.ExternalBlob;
  };

  public func run(oldActor : OldActor) : NewActor {
    // Transform equipment records
    let newEquipmentMap = oldActor.equipmentMap.map<Nat, OldEquipment, Equipment>(
      func(_id, oldEquipment) {
        {
          oldEquipment with
          additionalInformation = "";
          discipline = #unknown;
        };
      }
    );

    // Transform spare parts
    let newSparePartsMap = oldActor.sparePartsMap.map<Nat, List.List<OldSparePart>, List.List<SparePart>>(
      func(_id, oldPartsList) {
        oldPartsList.map<OldSparePart, SparePart>(
          func(oldPart) {
            {
              oldPart with
              additionalInformation = "";
            };
          }
        );
      }
    );

    // Transform cataloguing records
    let newCataloguingMap = oldActor.cataloguingMap.map<Nat, List.List<OldCataloguingRecord>, List.List<CataloguingRecord>>(
      func(_id, oldRecordsList) {
        oldRecordsList.map<OldCataloguingRecord, CataloguingRecord>(
          func(oldRecord) {
            {
              oldRecord with
              additionalInformation = "";
            };
          }
        );
      }
    );

    // Transform maintenance records
    let newMaintenanceMap = oldActor.maintenanceMap.map<Nat, List.List<OldMaintenanceRecord>, List.List<MaintenanceRecord>>(
      func(_id, oldRecordsList) {
        oldRecordsList.map<OldMaintenanceRecord, MaintenanceRecord>(
          func(oldRecord) {
            {
              oldRecord with
              additionalInformation = "";
            };
          }
        );
      }
    );

    // Transform documents
    let newDocumentMap = oldActor.documentMap.map<Nat, List.List<OldDocument>, List.List<Document>>(
      func(_id, oldDocsList) {
        oldDocsList.map<OldDocument, Document>(
          func(oldDoc) {
            {
              oldDoc with
              additionalInformation = "";
            };
          }
        );
      }
    );

    {
      oldActor with
      equipmentMap = newEquipmentMap;
      sparePartsMap = newSparePartsMap;
      cataloguingMap = newCataloguingMap;
      maintenanceMap = newMaintenanceMap;
      documentMap = newDocumentMap;
    };
  };
};

