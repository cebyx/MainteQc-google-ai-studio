import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Package, Plus, Trash2, Edit2, Check, X, DollarSign } from 'lucide-react';
import { MaterialUsed } from '../types';
import { cn } from '../lib/utils';

interface PartsUsedPanelProps {
  ticketId: string;
  allowEdit?: boolean;
}

export const PartsUsedPanel: React.FC<PartsUsedPanelProps> = ({ ticketId, allowEdit = true }) => {
  const { materialsUsed, addMaterialUsed, updateMaterialUsed, deleteMaterialUsed, role } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newPart, setNewPart] = useState({
    description: '',
    quantity: 1,
    unitCost: 0,
    notes: ''
  });

  const ticketMaterials = materialsUsed.filter(m => m.ticketId === ticketId);
  const totalCost = ticketMaterials.reduce((sum, m) => sum + (m.total || 0), 0);

  const handleAddPart = async () => {
    if (!newPart.description || newPart.quantity <= 0) return;

    try {
      await addMaterialUsed({
        ticketId,
        ...newPart
      });
      setNewPart({ description: '', quantity: 1, unitCost: 0, notes: '' });
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add part", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Parts & Materials ({ticketMaterials.length})
        </h3>
        
        {allowEdit && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Part
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Part Name / Description</label>
              <input 
                type="text" 
                placeholder="e.g. 1/2 inch PVC Pipe"
                className="w-full text-xs p-2 border rounded"
                value={newPart.description}
                onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Quantity</label>
              <input 
                type="number" 
                className="w-full text-xs p-2 border rounded"
                value={newPart.quantity}
                onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Unit Cost ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full text-xs p-2 border rounded"
                value={newPart.unitCost}
                onChange={(e) => setNewPart({ ...newPart, unitCost: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsAdding(false)}
              className="text-xs px-2 py-1 border rounded hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddPart}
              className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            >
              Save Part
            </button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-2 font-semibold">Part Name</th>
              <th className="text-center p-2 font-semibold">Qty</th>
              <th className="text-right p-2 font-semibold">Cost</th>
              <th className="text-right p-2 font-semibold">Total</th>
              {allowEdit && <th className="w-8"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {ticketMaterials.length === 0 ? (
              <tr>
                <td colSpan={allowEdit ? 5 : 4} className="p-4 text-center text-muted-foreground italic">
                  No parts recorded for this ticket.
                </td>
              </tr>
            ) : (
              ticketMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-2 font-medium">{material.description}</td>
                  <td className="p-2 text-center">{material.quantity}</td>
                  <td className="p-2 text-right">${material.unitCost.toFixed(2)}</td>
                  <td className="p-2 text-right font-semibold">${material.total.toFixed(2)}</td>
                  {allowEdit && (
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => {
                          if (window.confirm('Remove this part?')) {
                            deleteMaterialUsed(material.id);
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {ticketMaterials.length > 0 && (
            <tfoot className="bg-muted/30 font-bold border-t">
              <tr>
                <td colSpan={3} className="p-2 text-right uppercase text-[10px]">Total Materials Cost:</td>
                <td className="p-2 text-right text-primary">${totalCost.toFixed(2)}</td>
                {allowEdit && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
