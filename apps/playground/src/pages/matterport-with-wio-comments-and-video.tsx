import { v4 as generateId } from 'uuid'
import { Room, LauncherFacade, WhoIsOnline, Comments, VideoConference } from '../lib/sdk'
import { MatterportPin, MatterportPresence3D } from '../lib/matterport'

import { getConfig } from "../config"
import { useCallback, useEffect, useRef } from 'react'

const MATTERPORT_KEY = getConfig<string>('keys.matterport')
const SUPERVIZ_KEY = getConfig<string>('keys.superviz')
const SUPERVIZ_ROOM_PREFIX = getConfig<string>('roomPrefix')

type WindowWithMP_SDK = Window & {
  MP_SDK: {
    connect: (window: Window, key: string) => Promise<unknown>
  }
}

export function MatterportWithWioCommentsAndVideo() {
  const containerId = 'matterport-container' 
  const modelId = 'Zh14WDtkjdC'
  const room = useRef<LauncherFacade | null>(null)
  const mpSdk = useRef<any | null>()


  const initializeSuperViz = useCallback(async (matterportInstance: never) => {
    const uuid = generateId()

    room.current = await Room(SUPERVIZ_KEY, {
      roomId: `${SUPERVIZ_ROOM_PREFIX}-presence-3d`,
      participant: {
        name: 'partcipant',
        id: uuid,
      },
      group: { 
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: 'dev',
      debug: true,
    })

    const matterportPresence = new MatterportPresence3D(matterportInstance, {
      isAvatarsEnabled: true,
      isLaserEnabled: true,
      isNameEnabled: true,
    })

    const wio = new WhoIsOnline({
      position: 'container'
    })

    const iframe = document.getElementById(containerId) as HTMLIFrameElement
    const pinAdapter = new MatterportPin(matterportInstance, iframe)
    const commments = new Comments(pinAdapter, { buttonLocation: 'container' })

    const videoConference = new VideoConference({
      participantType: 'host',
      enableFollow: true,
      enableGather: true,
      enableGoTo: true,
      collaborationMode: {
        enabled: true,
      },
      defaultAvatars: true,
    })

    room.current.addComponent(wio)
    room.current.addComponent(matterportPresence)
    room.current.addComponent(commments)
    room.current.addComponent(videoConference)
  }, [])

  const initializeMatterport = useCallback(async () => {
    const showcase = document.getElementById(containerId) as HTMLIFrameElement
    
    if(!showcase) return

    showcase.onload = async () => {
      
      const showcaseWindow = showcase.contentWindow as WindowWithMP_SDK;

      mpSdk.current = await showcaseWindow.MP_SDK.connect(
        showcaseWindow,
        MATTERPORT_KEY
      );
      
      initializeSuperViz(mpSdk.current as never);
    };

  }, [initializeSuperViz])

  useEffect(() => { 
    initializeMatterport()

    return () => { 
      room?.current?.destroy()
      mpSdk.current?.disconnect()
    }
  }, [])

  return (
    <div className='h-full w-full flex flex-col'>
      <header className='p-2 flex bg-purple-200 h-[50px]' id='container'></header>
      <div className='flex-1'>
        <iframe
          className='matterport-iframe'
          id={containerId}
          src={`/mp-bundle/showcase.html?&brand=0&mls=2&mt=0&search=0&kb=0&play=1&qs=1&applicationKey=${MATTERPORT_KEY}&m=${modelId}`}
        />
      </div>
    </div>
    
  )
}

