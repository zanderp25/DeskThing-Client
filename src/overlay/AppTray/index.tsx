import { IconArrowDown, IconEllipsis, IconGear, IconHome } from '@src/assets/Icons'
import Button from '@src/components/ui/Button'
import { useSettingsStore } from '@src/stores'
import { ViewMode } from '@src/types'
import React, { useEffect, useState } from 'react'
import TrayContent from './TrayContent'

const AppTray: React.FC = () => {
    const appTrayState = useSettingsStore((store) => store.preferences.appTrayState)
    const currentView = useSettingsStore((store) => store.preferences.currentView)
    const usePullTabs = useSettingsStore((store) => store.preferences.showPullTabs)
    const setPreferences = useSettingsStore((store) => store.updatePreferences)
    const [height, setHeight] = useState('h-0')
    const [tabVisible, setTabVisible] = useState(true)

    useEffect(() => {
        setHeight(appTrayState === ViewMode.PEEK ? 'h-36' : appTrayState === ViewMode.HIDDEN ? 'h-0' : 'h-screen') 
    }, [appTrayState])

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (appTrayState === ViewMode.PEEK) {
            timer = setTimeout(() => {
                setPreferences({ appTrayState: ViewMode.HIDDEN })
            }, 3000)
        }
        return () => clearTimeout(timer)
    }, [appTrayState, setPreferences])

    useEffect(() => {
        setTabVisible(true)
        const timer = setTimeout(() => {
            setTabVisible(false)
        }, 2000)
        return () => clearTimeout(timer)
    }, [appTrayState, currentView])

    const onClick = () => {
        setTabVisible(true)
        if (appTrayState === ViewMode.HIDDEN) {
            setPreferences({ appTrayState: ViewMode.PEEK })
        } else if (appTrayState === ViewMode.PEEK) {
            setPreferences({ appTrayState: ViewMode.FULL })
        } else {
            setPreferences({ appTrayState: ViewMode.HIDDEN })
        }
    }
    
    const gotoSettings = () => {
        setPreferences({ currentView: { name: 'settings' }})
        setPreferences({ appTrayState: ViewMode.PEEK })
    }
    
    const gotoDashboard = () => {
        setPreferences({ currentView: { name: 'dashboard' }})
        setPreferences({ appTrayState: ViewMode.PEEK })
    }

    useEffect(() => {
        setTimeout(() => {
            setPreferences({ appTrayState: ViewMode.PEEK })

        }, 200)
    }, [currentView])

    return (
        <div className={`w-screen flex flex-col absolute top-0 ${appTrayState == ViewMode.FULL ? 'bg-zinc-950 transition-colors' : 'bg-zinc-950'} transition-[height] z-10 ${height}`}>
                {usePullTabs && (
                    <div className={`fixed flex justify-center items-center h-28 w-14 bg-zinc-900 transition-opacity duration-300 ${tabVisible ? 'opacity-100' : 'opacity-0'}`}
                         onMouseEnter={() => setTabVisible(true)}
                         onTouchStart={() => setTabVisible(true)}>
                        <Button className="mr-2" onClick={onClick}>
                            <IconArrowDown className={`${appTrayState == ViewMode.FULL && 'rotate-180'} transition-transform`} />
                        </Button>
                    </div>
                )}
                <TrayContent />
                <div className={`${appTrayState == ViewMode.FULL ? 'h-14' : 'h-0'} transition-[height] mb-5 flex justify-between overflow-hidden w-screen bg-black absolute bottom-0`}>
                    <div className="flex items-center px-2 ">
                        <p className="text-zinc-500">
                            Active App:
                        </p>
                        <p className="ml-2">
                            {currentView?.manifest?.label || currentView.name}
                        </p>
                    </div>
                    <div className="flex items-center px-2">
                        <Button className="items-center" onClick={gotoSettings}>
                            <p className="font-semibold mr-2">
                                Global Settings
                            </p>
                            <IconGear strokeWidth={0} />
                        </Button>
                        <Button className="items-center" onClick={gotoDashboard}>
                            <IconHome strokeWidth={2} fill={'none'} />
                        </Button>
                    </div>
                </div>
                <button className='w-screen absolute bg-zinc-900 bottom-0 h-5 flex items-center justify-center' onClick={onClick}>
                    <IconEllipsis />
                </button>
        </div>
    )
}

export default AppTray