'use client'
import { createContext, useContext, useReducer } from 'react';

const OrderContext = createContext();

const initialState = {
  items: [],
  total: 0,
};

const orderReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        (item) => item.product._id === action.payload._id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product._id === action.payload._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          total: state.total + action.payload.price,
        };
      }

      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
        total: state.total + action.payload.price,
      };
    }

    case 'REMOVE_ITEM': {
      const item = state.items.find(
        (item) => item.product._id === action.payload
      );
      
      if (!item) return state;

      if (item.quantity === 1) {
        return {
          ...state,
          items: state.items.filter((item) => item.product._id !== action.payload),
          total: state.total - item.product.price,
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.product._id === action.payload
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ),
        total: state.total - item.product.price,
      };
    }

    case 'CLEAR_ORDER':
      return initialState;

    default:
      return state;
  }
};

export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  const addToOrder = (product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeFromOrder = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const clearOrder = () => {
    dispatch({ type: 'CLEAR_ORDER' });
  };

  return (
    <OrderContext.Provider
      value={{
        order: state,
        addToOrder,
        removeFromOrder,
        clearOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}; 