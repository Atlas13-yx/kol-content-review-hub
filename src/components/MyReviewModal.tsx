import React from 'react';
import { IntegratedReviewWorkbenchModal } from './IntegratedReviewWorkbenchModal';
import { AssetType } from '../types';

interface MyReviewModalProps {
  isOpen: boolean;
  contentId: string;
  assetType: AssetType;
  versionId?: string;
  versionNumber?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const MyReviewModal: React.FC<MyReviewModalProps> = ({
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
      reviewerRole="Me"
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

