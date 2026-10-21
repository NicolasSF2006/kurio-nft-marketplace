import { marketplacePreview } from './marketplace'
import type { CatalogNft } from '@/types/api'

export const catalog: CatalogNft[] = Array.from({ length: 36 }, (_, index) => {
  const original = marketplacePreview.nfts[index % marketplacePreview.nfts.length]!
  const variant = Math.floor(index / marketplacePreview.nfts.length)
  const name = variant ? `${original.name} · Série ${variant + 1}` : original.name
  const network = ['Ethereum', 'Polygon', 'Solana'][Math.floor(index / 3) % 3]!
  return {
    ...original,
    version: 1,
    id: variant ? `${original.id}-serie-${variant + 1}` : original.id,
    name,
    description: original.description.replaceAll('Ethereum', network),
    ...(original.mobileDescription
      ? { mobileDescription: original.mobileDescription.replaceAll('Ethereum', network) }
      : {}),
    collection: marketplacePreview.collections[index % marketplacePreview.collections.length]!.name,
    network,
    details: {
      description: `${name} é uma obra digital ${original.edition} finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      provenance: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS. Referência simulada.`,
      contract: '0x7A42...19E8 • Contrato inteligente ERC-721 ilustrativo, sem transação real.',
      royalties:
        'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
    },
    editions: [
      { id: '1/1', stock: 0 },
      { id: '1/10', stock: 10 },
      { id: '1/50', stock: 50 },
      { id: 'ABERTA', stock: 25 },
    ],
    popularity: (index * 17) % 100,
  }
})
