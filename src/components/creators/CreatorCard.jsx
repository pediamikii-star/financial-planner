import { Pencil, Trash2, Wallet } from "lucide-react";
import { creatorStore } from "../../stores/creator.store";
import { getCreatorLogo } from "../../utils/creatorUtils";
import { useState } from "react";

export default function CreatorCard({ creator, onEdit, onWithdraw }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // GET FRESH DATA FROM STORE to ensure ID matches
  const freshCreator = creatorStore.getById(creator.id) || creator;
  
  const {
    id,
    platform = "Unknown",
    channel = "",
    name = "",
    type = "",
    description = "",
    platformBalance = 0,
    balance = 0,
    totalBalance = 0,
    notes = ""
  } = freshCreator;

  // Use the CORRECT ID from store
  const creatorId = id;
  const creatorName = channel || name;
  const creatorBalance = Number(platformBalance || balance || 0);
  const logo = getCreatorLogo(platform);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      creatorStore.remove(creatorId);
      window.dispatchEvent(new Event("creatorsUpdated"));
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    }
  };

  const handleWithdrawClick = () => {
    console.log("💳 CreatorCard Withdraw Clicked:", {
      creatorId,
      creatorName,
      platform,
      balance: creatorBalance,
      incomeType: type
    });

    onWithdraw({
      id: creatorId,
      platform,
      name: creatorName,
      channel: creatorName,
      description: type || description,
      balance: creatorBalance,
      platformBalance: creatorBalance,
      incomeType: type,
      totalBalance,
      notes
    });
  };

  const handleEditClick = () => {
    console.log("✏️ Editing creator:", { id: creatorId, name: creatorName, type });
    onEdit(freshCreator);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative group">
      {/* ACTION BUTTONS EDIT/DELETE */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {/* EDIT BUTTON */}
        <button 
          onClick={handleEditClick}
          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 transition-all duration-200 text-opacity-80 hover:text-opacity-100 border border-emerald-100 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          title="Edit Creator"
        >
          <Pencil size={14} strokeWidth={2} />
        </button>
        
        {/* DELETE BUTTON */}
        <button 
          onClick={handleDelete}
          className={`p-1.5 rounded-lg transition-all duration-200 border ${
            showDeleteConfirm 
              ? "bg-red-600 text-white border-red-700" 
              : "hover:bg-red-50 text-red-400 hover:text-red-600 border-red-100"
          } hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          title={showDeleteConfirm ? "Click again to confirm delete" : "Delete Creator"}
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* HEADER */}
      <div className="flex items-center gap-4 pt-1">
        {/* LOGO */}
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-emerald-100 shadow-sm flex-shrink-0">
          <img
            src={logo}
            alt={platform}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.src = "/images/default-creator.png";
            }}
          />
        </div>

        {/* INFO */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-emerald-900 leading-tight truncate">
            {creatorName}
          </h3>
          {/* Hanya tampilkan Income Type, Platform dihapus */}
          <p className="text-xs text-emerald-700 mt-0.5">
            {type || description || "No income type"}
          </p>
        </div>
      </div>

      {/* BALANCE & WITHDRAW BUTTON */}
      <div className="mt-4 flex items-center justify-between">
        {/* BALANCE */}
        <div>
          <p className="text-emerald-800 font-bold text-lg">
            Rp {creatorBalance.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Platform Balance
          </p>
        </div>

        {/* WITHDRAW BUTTON */}
        <button
          onClick={handleWithdrawClick}
          className="text-emerald-600 hover:text-emerald-700 mt-7 text-xs flex items-center gap-1.5 hover:underline"
          title="Withdraw Funds"
        >
          <Wallet size={14} />
          <span>Withdraw</span>
        </button>
      </div>

      {/* TOTAL BALANCE INFO */}
      {totalBalance > 0 && (
        <div className="mt-2 pt-2 border-t border-emerald-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-emerald-700">Total Balance:</span>
            <span className="text-xs font-medium text-emerald-800">
              Rp {Number(totalBalance).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}

      {/* NOTES */}
      {notes && (
        <p className="text-xs text-emerald-600 mt-2 line-clamp-2">
          {notes}
        </p>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="mt-3 pt-2 border-t border-red-200">
          <div className="text-xs text-red-600 font-medium flex items-center gap-1">
            <span>Click trash icon again to confirm delete</span>
          </div>
        </div>
      )}
    </div>
  );
}