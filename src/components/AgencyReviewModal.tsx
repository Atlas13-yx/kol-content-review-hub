import React from 'react';
import { IntegratedReviewWorkbenchModal } from './IntegratedReviewWorkbenchModal';
import { AssetType } from '../types';

interface AgencyReviewModalProps {
  isOpen: boolean;
  contentId: string;
  assetType: AssetType;
  versionId?: string;
  versionNumber?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgencyReviewModal: React.FC<AgencyReviewModalProps> = ({
  isOpen,
  contentId,
  assetType,
  versionNumber,
  onClose,
  onSuccess,
}) => {
  return (
    <IntegratedReviewWorkbenchModal
      isOpen={isOpen}
      contentId={contentId}
      assetType={assetType}
      versionNumber={versionNumber}
      reviewerRole="Agency"
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};


