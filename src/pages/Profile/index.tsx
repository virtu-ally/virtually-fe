import { useAuth } from "../../context/FirebaseAuthContext";

const Profile = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading ...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt={user.displayName || user.email || "User"}
        />
      )}
      <h2>{user.displayName || user.email}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default Profile;
