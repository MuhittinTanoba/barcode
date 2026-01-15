import React from 'react';
import { useOrder } from '../context/OrderContext';

const OrderPanel = () => {
  const { order, removeFromOrder, clearOrder } = useOrder();

  return (
    <div className="bg-white rounded-2xl border border-border h-[calc(100vh-8rem)] flex flex-col shadow-sm">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-secondary p-2 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">Current Order</h2>
        </div>
        {order.items.length > 0 && (
          <button
            onClick={clearOrder}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
            title="Clear Order"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {order.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 opacity-60">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="font-medium">No items in order</p>
          </div>
        ) : (
          order.items.map((item) => (
            <div key={item.product._id} className="group flex items-start gap-3 bg-muted/30 hover:bg-muted/60 p-3 rounded-xl transition-colors border border-transparent hover:border-border">
              <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-border">
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-foreground truncate pr-2">{item.product.title}</h3>
                  <span className="font-semibold text-foreground whitespace-nowrap">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">${item.product.price.toFixed(2)} × {item.quantity}</p>
                {item.description && (
                  <p className="text-xs text-primary/80 italic mt-1 line-clamp-1">
                    Note: {item.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeFromOrder(item.product._id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-muted/30 border-t border-border rounded-b-2xl">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Tax (8%)</span>
            <span>${(order.total * 0.08).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-foreground pt-2 border-t border-border/50">
            <span>Total</span>
            <span>${(order.total * 1.08).toFixed(2)}</span>
          </div>
        </div>
        <button
          disabled={order.items.length === 0}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
        >
          <span>Place Order</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OrderPanel;