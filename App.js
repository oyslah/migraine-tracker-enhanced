import React, { Suspense } from 'react';
import { MedicationType } from './types.js';
import { DEFAULT_TRIGGERS, DEFAULT_MEDICATIONS, DEFAULT_MOH_RULES, DEFAULT_SYMPTOMS } from './constants.js';
import { MenuIcon, XIcon, ChartBarIcon, CogIcon, Card, HomeIcon, Button, CalendarIcon } from './components/ui.js';
import { migrateAttacks, migrateTriggerLogs, migrateMedications, migrateMedicationIntakes, migrateTriggers, migrateMohRules, migrateSymptoms } from './services/dataMigration.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import { db } from './services/db.js';

const Dashboard = React.lazy(() => import('./components/Dashboard.js'));
const Analytics = React.lazy(() => import('./components/Analytics.js'));
const LogAndSettings = React.lazy(() => import('./components/LogAndSettings.js'));
const LifeChanges = React.lazy(() => import('./components/LifeChanges.js'));

const AnalyticsErrorFallback = () => (
    React.createElement(Card, { title: "Analytics Error" },
        React.createElement('div', { className: "p-4 border border-dark-danger/50 bg-dark-danger/10 rounded-lg" },
            React.createElement('h3', { className: "font-semibold text-dark-danger" }, "Could Not Load Analytics"),
            React.createElement('p', { className: "text-dark-text-secondary mt-2" }, "An unexpected error occurred while trying to render the analytics charts."),
            React.createElement('p', { className: "text-dark-text-secondary mt-1" }, "This can sometimes be caused by corrupted data. Please try the following:"),
            React.createElement('ul', { className: "list-disc list-inside text-sm text-dark-text-secondary mt-2 pl-2" },
                React.createElement('li', null, "Go to the \"Logs & Settings\" tab and verify your attack and medication history for any invalid entries."),
                React.createElement('li', null, "Try refreshing the application.")
            )
        )
    )
);

const InstallBanner = ({ onInstall, onDismiss }) => {
    return React.createElement('div', {
        'aria-live': 'polite',
        className: "fixed bottom-0 left-0 right-0 bg-dark-bg-secondary p-4 border-t border-dark-border shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-50"
    },
    React.createElement('div', {
            className: "max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        },
        React.createElement('div', { className: "text-center sm:text-left" },
            React.createElement('h4', { className: "font-bold text-dark-text-primary" }, "Install Migraine Tracker"),
            React.createElement('p', { className: "text-sm text-dark-text-secondary" }, "Add this app to your home screen for quick access and a reliable offline experience.")
        ),
        React.createElement('div', {
                className: "flex gap-3 flex-shrink-0"
            },
            React.createElement(Button, { variant: "secondary", onClick: onDismiss }, "Not Now"),
            React.createElement(Button, { variant: "primary", onClick: onInstall }, "Install")
        )
      )
    );
};


const App = () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [attacks, setAttacks] = React.useState([]);
    const [medications, setMedications] = React.useState([]);
    const [medicationIntakes, setMedicationIntakes] = React.useState([]);
    const [triggers, setTriggers] = React.useState([]);
    const [symptoms, setSymptoms] = React.useState([]);
    const [triggerLogs, setTriggerLogs] = React.useState([]);
    const [mohRules, setMohRules] = React.useState([]);
    const [disabilityLogs, setDisabilityLogs] = React.useState([]);
    const [lifeChanges, setLifeChanges] = React.useState([]);
    const [installPromptEvent, setInstallPromptEvent] = React.useState(null);
    const [showInstallBanner, setShowInstallBanner] = React.useState(false);


    React.useEffect(() => {
        const initializeApp = async () => {
            try {
                // Request persistent storage to protect data from auto-clearing
                if (navigator.storage && navigator.storage.persist) {
                    const isPersisted = await navigator.storage.persisted();
                    if (!isPersisted) {
                        const wasPersisted = await navigator.storage.persist();
                        console.log(`Persistent storage request status: ${wasPersisted ? 'Granted' : 'Denied'}`);
                    } else {
                        console.log('Storage is already persistent.');
                    }
                }
                
                const migrationNeeded = !localStorage.getItem('mygraine_migration_to_idb_complete_v1');

                if (migrationNeeded) {
                    console.log("Migration to IndexedDB needed. Starting process...");
                    const lsKeys = {
                        attacks: 'mygraine_attacks',
                        medications: 'mygraine_medications',
                        medicationIntakes: 'mygraine_medication_intakes',
                        triggers: 'mygraine_triggers',
                        symptoms: 'mygraine_symptoms',
                        triggerLogs: 'mygraine_trigger_logs',
                        mohRules: 'mygraine_moh_rules',
                    };

                    const migrationFns = {
                        attacks: migrateAttacks,
                        medications: migrateMedications,
                        medicationIntakes: migrateMedicationIntakes,
                        triggers: migrateTriggers,
                        symptoms: migrateSymptoms,
                        triggerLogs: migrateTriggerLogs,
                        mohRules: migrateMohRules,
                    };
                    
                    const defaultValues = {
                        medications: DEFAULT_MEDICATIONS,
                        triggers: DEFAULT_TRIGGERS,
                        symptoms: DEFAULT_SYMPTOMS,
                        mohRules: DEFAULT_MOH_RULES
                    };

                    await db.transaction('rw', db.attacks, db.medications, db.medicationIntakes, db.triggers, db.symptoms, db.triggerLogs, db.mohRules, db.disabilityLogs, async () => {
                        for (const key in lsKeys) {
                            const lsKey = lsKeys[key];
                            const item = localStorage.getItem(lsKey);
                            let dataToStore = [];
                            
                            if (item) {
                                let parsed = JSON.parse(item);
                                if (migrationFns[key]) {
                                    parsed = migrationFns[key](parsed);
                                }
                                dataToStore = parsed;
                            } else if (defaultValues[key]) {
                                dataToStore = defaultValues[key];
                                // If initializing symptoms from defaults, they must be converted to objects for the DB.
                                if (key === 'symptoms') {
                                    dataToStore = dataToStore.map(s => ({ id: s, name: s }));
                                }
                            }
                            
                            if (dataToStore && dataToStore.length > 0) {
                                await db[key].bulkPut(dataToStore);
                                console.log(`Migrated ${dataToStore.length} items for ${key}`);
                            }
                        }
                    });
                    
                    localStorage.setItem('mygraine_migration_to_idb_complete_v1', 'true');
                    console.log("Migration complete.");
                }

                // Load all data from IndexedDB
                const [
                    attacksData,
                    medicationsData,
                    medicationIntakesData,
                    triggersData,
                    symptomsData,
                    triggerLogsData,
                    mohRulesData,
                    disabilityLogsData,
                    lifeChangesData,
                ] = await Promise.all([
                    db.attacks.orderBy('startTime').reverse().toArray(),
                    db.medications.toArray(),
                    db.medicationIntakes.orderBy('timestamp').reverse().toArray(),
                    db.triggers.toArray(),
                    db.symptoms.toArray(),
                    db.triggerLogs.orderBy('date').reverse().toArray(),
                    db.mohRules.toArray(),
                    db.disabilityLogs.orderBy('date').reverse().toArray(),
                    db.lifeChanges.orderBy('date').reverse().toArray(),
                ]);
                
                setAttacks(attacksData);
                setMedications(medicationsData.length > 0 ? medicationsData : DEFAULT_MEDICATIONS);
                setMedicationIntakes(medicationIntakesData);
                setTriggers(triggersData.length > 0 ? triggersData : DEFAULT_TRIGGERS);
                // The symptoms state should always be a string array for consistency.
                // We map the objects from the DB to strings here.
                setSymptoms(symptomsData.length > 0 ? symptomsData.map(s => s.name) : DEFAULT_SYMPTOMS);
                setTriggerLogs(triggerLogsData);
                setMohRules(mohRulesData.length > 0 ? mohRulesData : DEFAULT_MOH_RULES);
                setDisabilityLogs(disabilityLogsData);
                setLifeChanges(lifeChangesData);

            } catch (error) {
                console.error("Failed to load or migrate data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPromptEvent(event);
            setShowInstallBanner(true);
            console.log('`beforeinstallprompt` event fired and stashed.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
  
  const [currentView, setCurrentView] = React.useState('home');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
        return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setInstallPromptEvent(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
      setShowInstallBanner(false);
  };
  
  const addAttack = async (attack) => {
    await db.attacks.add(attack);
    const allAttacks = await db.attacks.orderBy('startTime').reverse().toArray();
    setAttacks(allAttacks);
  };
  const updateAttack = async (updatedAttack) => {
    await db.attacks.put(updatedAttack);
    const allAttacks = await db.attacks.orderBy('startTime').reverse().toArray();
    setAttacks(allAttacks);
  };
  const deleteAttack = async (attackId) => {
    await db.attacks.delete(attackId);
    setAttacks(prev => prev.filter(a => a.id !== attackId));
  };
  
  const addMedicationIntake = async (intake) => {
    await db.medicationIntakes.add(intake);
    const allIntakes = await db.medicationIntakes.orderBy('timestamp').reverse().toArray();
    setMedicationIntakes(allIntakes);
  };
  const updateMedicationIntake = async (updatedIntake) => {
    await db.medicationIntakes.put(updatedIntake);
    const allIntakes = await db.medicationIntakes.orderBy('timestamp').reverse().toArray();
    setMedicationIntakes(allIntakes);
  };
  const deleteMedicationIntake = async (intakeId) => {
    await db.medicationIntakes.delete(intakeId);
    setMedicationIntakes(prev => prev.filter(i => i.id !== intakeId));
  };

  const upsertTriggerLog = async (log) => {
    await db.triggerLogs.put(log);
    const allLogs = await db.triggerLogs.orderBy('date').reverse().toArray();
    setTriggerLogs(allLogs);
  };

  const upsertDisabilityLog = async (log) => {
    await db.disabilityLogs.put(log);
    const allLogs = await db.disabilityLogs.orderBy('date').reverse().toArray();
    setDisabilityLogs(allLogs);
  };
  
  const handleSetMedications = async (newMedications) => {
      await db.medications.clear();
      await db.medications.bulkAdd(newMedications);
      setMedications(newMedications);
  }
  
  const handleSetTriggers = async (newTriggers) => {
      await db.triggers.clear();
      await db.triggers.bulkAdd(newTriggers);
      setTriggers(newTriggers);
  }

  const handleSetSymptoms = async (newSymptoms) => {
      await db.symptoms.clear();
      await db.symptoms.bulkAdd(newSymptoms.map(s => ({id: s, name: s}))); // Dexie needs objects
      setSymptoms(newSymptoms);
  }
  
  const handleSetMohRules = async (newMohRules) => {
      await db.mohRules.clear();
      await db.mohRules.bulkAdd(newMohRules);
      setMohRules(newMohRules);
  }

  const addMedication = async (med) => {
      await db.medications.add(med);
      const allMeds = await db.medications.toArray();
      setMedications(allMeds);
  }

  const addLifeChange = async (lc) => {
      await db.lifeChanges.add(lc);
      const all = await db.lifeChanges.orderBy('date').reverse().toArray();
      setLifeChanges(all);
  };
  const updateLifeChange = async (lc) => {
      await db.lifeChanges.put(lc);
      const all = await db.lifeChanges.orderBy('date').reverse().toArray();
      setLifeChanges(all);
  };
  const deleteLifeChange = async (id) => {
      await db.lifeChanges.delete(id);
      setLifeChanges(prev => prev.filter(lc => lc.id !== id));
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: React.createElement(HomeIcon), view: 'home' },
    { id: 'analytics', label: 'Analytics', icon: React.createElement(ChartBarIcon), view: 'analytics' },
    { id: 'life_changes', label: 'Life Changes', icon: React.createElement(CalendarIcon), view: 'life_changes' },
    { id: 'log_settings', label: 'Logs & Settings', icon: React.createElement(CogIcon), view: 'log_settings' },
  ];

  const renderView = () => {
    if (isLoading) {
        return React.createElement(LoadingFallback);
    }
    switch (currentView) {
      case 'home':
        return React.createElement(Dashboard, {
          attacks: attacks,
          triggers: triggers,
          triggerLogs: triggerLogs,
          addAttack: addAttack,
          updateAttack: updateAttack,
          deleteAttack: deleteAttack,
          upsertTriggerLog: upsertTriggerLog,
          medications: medications,
          medicationIntakes: medicationIntakes,
          addMedicationIntake: addMedicationIntake,
          updateMedicationIntake: updateMedicationIntake,
          deleteMedicationIntake: deleteMedicationIntake,
          symptoms: symptoms,
          setSymptoms: handleSetSymptoms,
          disabilityLogs: disabilityLogs,
          upsertDisabilityLog: upsertDisabilityLog,
          mohRules: mohRules,
          addMedication: addMedication
        });
      case 'analytics':
        return React.createElement(ErrorBoundary, { fallback: React.createElement(AnalyticsErrorFallback) },
            React.createElement(Analytics, {
              attacks: attacks,
              triggerLogs: triggerLogs,
              medicationIntakes: medicationIntakes,
              medications: medications,
              triggers: triggers,
              mohRules: mohRules,
              disabilityLogs: disabilityLogs,
              lifeChanges: lifeChanges,
            })
        );
      case 'log_settings':
        return React.createElement(LogAndSettings, {
          attacks: attacks,
          updateAttack: updateAttack,
          deleteAttack: deleteAttack,
          medications: medications,
          setMedications: handleSetMedications,
          medicationIntakes: medicationIntakes,
          addMedicationIntake: addMedicationIntake,
          updateMedicationIntake: updateMedicationIntake,
          deleteMedicationIntake: deleteMedicationIntake,
          triggers: triggers,
          setTriggers: handleSetTriggers,
          symptoms: symptoms,
          setSymptoms: handleSetSymptoms,
          triggerLogs: triggerLogs,
          upsertTriggerLog: upsertTriggerLog,
          mohRules: mohRules,
          setMohRules: handleSetMohRules,
          disabilityLogs: disabilityLogs,
          upsertDisabilityLog: upsertDisabilityLog,
        });
      case 'life_changes':
        return React.createElement(LifeChanges, {
          lifeChanges: lifeChanges,
          onAdd: addLifeChange,
          onUpdate: updateLifeChange,
          onDelete: deleteLifeChange,
        });
      default:
        return React.createElement(Dashboard, {
          attacks: attacks,
          triggers: triggers,
          triggerLogs: triggerLogs,
          addAttack: addAttack,
          updateAttack: updateAttack,
          deleteAttack: deleteAttack,
          upsertTriggerLog: upsertTriggerLog,
          medications: medications,
          medicationIntakes: medicationIntakes,
          addMedicationIntake: addMedicationIntake,
          updateMedicationIntake: updateMedicationIntake,
          deleteMedicationIntake: deleteMedicationIntake,
          symptoms: symptoms,
          setSymptoms: handleSetSymptoms,
          disabilityLogs: disabilityLogs,
          upsertDisabilityLog: upsertDisabilityLog,
          mohRules: mohRules,
          addMedication: addMedication
        });
    }
  };

  const LoadingFallback = () => (
    React.createElement('div', { className: "w-full h-full flex items-center justify-center" },
        React.createElement('p', { className: "text-dark-text-secondary" }, "Loading...")
    )
  );

  return (
    React.createElement(React.Fragment, null,
        React.createElement('div', { className: "min-h-screen bg-dark-bg text-dark-text-primary flex" },
        React.createElement('aside', { className: `bg-dark-bg-secondary w-64 absolute inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30` },
            React.createElement('div', { className: "p-5 flex items-center justify-between" },
            React.createElement('h1', { className: "text-2xl font-bold text-dark-primary" }, "Migraine Tracker"),
            React.createElement('button', { onClick: () => setIsMenuOpen(false), className: "md:hidden text-dark-text-secondary" },
                React.createElement(XIcon)
            )
            ),
            React.createElement('nav', { className: "mt-8" },
            navItems.map(item => (
                React.createElement('button',
                {
                    key: item.id,
                    onClick: () => {
                    setCurrentView(item.view);
                    setIsMenuOpen(false);
                    },
                    className: `w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${currentView === item.view ? 'bg-dark-bg text-dark-primary' : 'hover:bg-dark-bg text-dark-text-secondary'}`
                },
                React.createElement('span', { className: "w-6 h-6" }, item.icon),
                React.createElement('span', { className: "mx-4 font-medium" }, item.label)
                )
            ))
            )
        ),

        React.createElement('main', { className: "flex-1 flex flex-col" },
            React.createElement('header', { className: "bg-dark-bg-secondary p-4 flex items-center justify-between md:hidden" },
            React.createElement('button', { onClick: () => setIsMenuOpen(true) },
                React.createElement(MenuIcon)
            ),
            React.createElement('h1', { className: "text-lg font-bold text-dark-primary" }, "Migraine Tracker"),
            React.createElement('div', null)
            ),
            React.createElement('div', { className: "flex-1 p-4 md:p-8 overflow-y-auto" },
            React.createElement(Suspense, { fallback: React.createElement(LoadingFallback) },
                renderView()
            )
            )
        )
        ),
        showInstallBanner && React.createElement(InstallBanner, { onInstall: handleInstallClick, onDismiss: handleDismissInstall })
    )
  );
};

export default App;
