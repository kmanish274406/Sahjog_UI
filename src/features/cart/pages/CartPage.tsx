import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Panel } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useSettings } from '@/features/catalog/hooks/useCatalog'
import shared from '@/styles/shared.module.css'
import { formatCurrency } from '@/utils/format'
import { cartSubtotal, useCartStore } from '../store/cart.store'
import styles from './CartPage.module.css'

export default function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const update = useCartStore((state) => state.update)
  const remove = useCartStore((state) => state.remove)
  const settings = useSettings()

  if (items.length === 0) {
    return (
      <div className={shared.stack}>
        <PageHeader title="Your cart" />
        <Panel>
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            action={
              <Link to={ROUTES.services}>
                <Button>Browse services</Button>
              </Link>
            }
          >
            Add a service and a provider, then choose a day, time and address.
          </EmptyState>
        </Panel>
      </div>
    )
  }

  const fee = settings.data?.platformFee ?? 0
  const subtotal = cartSubtotal(items)

  return (
    <div className={shared.stack}>
      <PageHeader
        title="Your cart"
        description="Each service is booked separately, with its own day and time."
      />
      <div className={styles.layout}>
        <Panel title={`${items.length} ${items.length === 1 ? 'service' : 'services'}`} flush>
          <ul className={styles.items}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.emoji} aria-hidden="true">
                  {item.emoji}
                </span>
                <div className={styles.info}>
                  <strong>{item.serviceName}</strong>
                  <span className={shared.muted}>{item.providerName}</span>
                </div>
                <div
                  className={styles.qty}
                  role="group"
                  aria-label={`Quantity of ${item.serviceName}`}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label="One less"
                    disabled={item.qty <= 1}
                    onClick={() => update(item.id, { qty: item.qty - 1 })}
                  >
                    <Minus size={14} />
                  </Button>
                  <span className={styles.qtyValue}>{item.qty}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label="One more"
                    disabled={item.qty >= 5}
                    onClick={() => update(item.id, { qty: item.qty + 1 })}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <strong className={styles.price}>{formatCurrency(item.price * item.qty)}</strong>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${item.serviceName}`}
                  onClick={() => remove(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Summary">
          <table className={shared.ledger}>
            <tbody>
              <tr>
                <td>Services</td>
                <td>{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td>
                  Platform fee <span className={shared.muted}>(per booking)</span>
                </td>
                <td>{formatCurrency(fee * items.length)}</td>
              </tr>
              <tr className={shared.total}>
                <td>Estimated total</td>
                <td>{formatCurrency(subtotal + fee * items.length)}</td>
              </tr>
            </tbody>
          </table>
          <p className={`${shared.muted} ${shared.small}`} style={{ marginTop: 8 }}>
            The final amount, including any coupon, is confirmed by the server at checkout.
          </p>
          <div className={shared.formActions}>
            <Link to={ROUTES.services}>
              <Button variant="secondary">Add more</Button>
            </Link>
            <Button onClick={() => navigate(ROUTES.checkout)}>Choose date &amp; address</Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
