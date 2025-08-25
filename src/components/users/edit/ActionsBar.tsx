import Button from '@/components/common/Button';
import React from 'react';

const ActionsBar: React.FC<{
  canSave: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}> = ({ canSave, isSubmitting, onCancel }) => (
    <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={!canSave} variant="success">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
			Cancel
        </Button>
    </div>
);

export default ActionsBar;