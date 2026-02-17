import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Old user profile type with department field.
  type OldUserProfile = {
    name : Text;
    department : Text;
  };

  // Old actor type matching previous state.
  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  // New user profile type (same as old here).
  type NewUserProfile = {
    name : Text;
    department : Text;
  };

  // New actor type matching new state.
  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    // No transformation needed if types are identical.
    { userProfiles = old.userProfiles };
  };
};
