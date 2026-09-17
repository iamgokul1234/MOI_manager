import React, { useState } from 'react';
import { Download, Home, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { AddEditFunctionModal } from './AddEditFunctionModal';
import { OurFunctionsList } from './ourFunctions/OurFunctionsList';
import { RelativeFunctionsList } from './relativeFunctions/RelativeFunctionsList';
import { tabToCategory, type FunctionsTab } from './constants';
import type { FunctionEvent } from '@/types';

/**
 * Functions is the primary hub of the app. Two tabs share one model and one
 * form, but behave very differently once opened:
 *  - Our Functions: the full Moi ledger (people, amounts, attended checklist)
 *  - Relative Functions: a lightweight "don't forget" reminder list
 */
export const FunctionsPage: React.FC = () => {
  const [tabParam, setTab] = useSearchParamState('tab', 'our');
  const tab: FunctionsTab = tabParam === 'relative' ? 'relative' : 'our';

  const [showAdd, setShowAdd] = useState(false);
  const [editFn, setEditFn] = useState<FunctionEvent | null>(null);
  const [exporting, setExporting] = useState(false);
  const { error } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCsv('/export/functions.csv', 'functions.csv');
    } catch (err) {
      error(getErrorMessage(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Functions"
        subtitle={
          tab === 'our'
            ? 'Events we host. Open one to see who gave what and mark attendance.'
            : "Other people's events we plan to attend."
        }
        actions={
          <>
            <Button
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              loading={exporting}
            >
              Export
            </Button>
            <Button id="add-function-btn" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
              Add Function
            </Button>
          </>
        }
      />

      <Tabs<FunctionsTab>
        value={tab}
        onChange={(t) => setTab(t)}
        tabs={[
          { key: 'our', label: 'Our Functions', icon: <Home className="h-4 w-4" /> },
          { key: 'relative', label: 'Relative Functions', icon: <Users className="h-4 w-4" /> },
        ]}
      />

      {tab === 'our' ? (
        <OurFunctionsList onAdd={() => setShowAdd(true)} onEdit={setEditFn} />
      ) : (
        <RelativeFunctionsList onAdd={() => setShowAdd(true)} onEdit={setEditFn} />
      )}

      <AddEditFunctionModal
        isOpen={showAdd || !!editFn}
        onClose={() => {
          setShowAdd(false);
          setEditFn(null);
        }}
        fn={editFn}
        defaultCategory={tabToCategory(tab)}
      />
    </div>
  );
};
