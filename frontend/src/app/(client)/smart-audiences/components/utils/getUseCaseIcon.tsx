import Image from 'next/image'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import MailOutlinedIcon from '@mui/icons-material/MailOutlined'

export const getUseCaseIcon = (status: string) => {
    switch (status) {
        case 'postal':
            return <Image src="/postal.svg" alt="postal icon" width={20} height={20} />
        case 'google':
            return <Image src="/google-ads.svg" alt="google icon" width={20} height={20} />
        case 'meta':
            return <Image src="/meta.svg" alt="meta icon" width={20} height={20} />
        case 'bing':
            return <Image src="/bing.svg" alt="bing icon" width={20} height={20} />
        case 'linkedin':
            return <Image src="/linkedin.svg" alt="linkedin icon" width={20} height={20}/>
        case 'tele_marketing':
            return <HeadsetMicOutlinedIcon />
        default:
            return <MailOutlinedIcon />
    }
}
