import React, { useState } from "react";
import useLocation from "@/hooks/useLocation";
import AvatarComponent from "../Avatar";
import Input from "../forms/Input";
import MapDisplay from "../Map";

interface EditProfileProps {
  form: any;
  targetUser: any;
  onClose: () => void;
  loading: boolean;
  onSubmit: (data: any) => Promise<void>;
  error: string | null;
  userSettings?: any;
}

const EditProfile: React.FC<EditProfileProps> = ({
  form,
  targetUser,
  onClose,
  loading,
  onSubmit,
  error,
}) => {
  const { location, setLocation } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const getAvatarUrl = () => {
    if (form.watch("avatar")?.[0]) return form.watch("avatar")[0].uri;
    if (form.watch("avatarUrl")) return form.watch("avatarUrl");
    return targetUser.avatar || null;
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      setFeedbackMessage("Profile updated");
      setTimeout(() => setFeedbackMessage(null), 2000);
    } catch (err: any) {
      console.error("Profile update failed", err);
      setFeedbackMessage(err?.message || "Update failed");
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Profile</h2>
        <button onClick={onClose} className="text-sm text-blue-600 hover:underline">
          ← Back to Profile
        </button>
      </div>

      <div className="flex flex-col items-center mb-4">
        <AvatarComponent
          avatar={getAvatarUrl()}
          username={targetUser.username}
          size={100}
        />
        <p className="text-xl font-semibold mt-2">{targetUser.username}</p>
        <p className="text-sm text-gray-500">{targetUser.kudos} Kudos</p>
      </div>

      {feedbackMessage && (
        <div className="text-green-700 text-center mb-4 font-semibold">
          {feedbackMessage}
        </div>
      )}

      {/* Form Inputs */}
      <div className="space-y-6">
        <div>
          <label className="block font-semibold mb-1">Email</label>
          <Input
            name="email"
            form={form}
            label="Email"
            registerOptions={{ required: true }}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Description</label>
          <Input
            name="description"
            form={form}
            label="Description"
            placeholder="Write a short bio..."
            multiline
          />
          <p className="text-xs text-gray-500 italic">
            This will appear on your public profile.
          </p>
        </div>

        <div>
          <label className="block font-semibold mb-1">Tags</label>
          <Input
            name="tags"
            form={form}
            label="Tags"
            placeholder="e.g., gardening, coding, climbing"
          />
          <p className="text-xs text-gray-500 italic">
            Separate tags with commas.
          </p>
        </div>

        <div>
          <label className="block font-semibold mb-1">Profile Picture</label>
          <Input
            name="avatarUrl"
            form={form}
            label="Profile Picture URL"
            placeholder="Paste an image URL"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Location</label>
          <MapDisplay
            regionID={targetUser.location?.regionID}
            coordinates={location}
            width={400}
            height={300}
            showAddressBar={true}
            exactLocation={false}
            onLocationChange={(data) => {
              if (data.coordinates) {
                setLocation(data.coordinates);
                form.setValue("location", {
                  ...data.coordinates,
                  name: data.name,
                });
              }
            }}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={form.handleSubmit(handleFormSubmit)}
            disabled={loading || isSubmitting}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
