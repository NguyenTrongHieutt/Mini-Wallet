# Sequence Diagram: P2P Chuyen tien `/wallet/transfer`
## Luong chinh

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant R as Sails Router
    participant P as isLoggedIn Policy
    participant C as Transfer Controller
    participant V as Transfer Validator
    participant WS as WalletService
    participant CM as Customer Model
    participant AT as Atomic Executor
    participant MS as Mongo Session
    participant PC as Pocket Collection
    participant TC as Transaction Collection

    U->>R: POST /wallet/transfer {receiverPhone, amount}
    R->>P: Check req.session.customerId

    alt User chua dang nhap
        P-->>U: HTTP 200 {err: 40002, message: SESSION_REQUIRED}
    else User da dang nhap
        P->>C: next()
        C->>V: validate({receiverPhone, amount})

        alt Request khong hop le
            V-->>C: {code: BAD_REQUEST, message, details}
            C-->>U: HTTP 200 {err: 40001, message, ...details}
        else Request hop le
            V-->>C: null
            C->>WS: transfer(customerId, receiverPhone, amount)

            WS->>CM: Find sender by customerId

            alt Khong tim thay sender
                CM-->>WS: null
                WS-->>C: AppError(NOT_FOUND, SESSION_REQUIRED)
                C-->>U: HTTP 200 {err: 40004, message: SESSION_REQUIRED}
            else Tim thay sender
                CM-->>WS: sender

                alt Sender chuyen cho chinh minh
                    WS-->>C: AppError(FORBIDDEN, SELF_TRANSFER)
                    C-->>U: HTTP 200 {err: 40003, message: SELF_TRANSFER, field: receiverPhone}
                else Receiver khac sender
                    WS->>CM: Find receiver by phone

                    alt Khong tim thay receiver
                        CM-->>WS: null
                        WS-->>C: AppError(NOT_FOUND, RECEIVER_NOT_FOUND)
                        C-->>U: HTTP 200 {err: 40004, message: RECEIVER_NOT_FOUND, field: receiverPhone}
                    else Tim thay receiver
                        CM-->>WS: receiver
                        WS->>AT: TransferTransaction(senderId, receiverId, amount)

                        AT->>MS: startSession()
                        AT->>MS: withTransaction()
                        AT->>PC: Find sender pocket

                        alt Khong tim thay vi sender
                            PC-->>AT: null
                            AT-->>WS: AppError(NOT_FOUND, WALLET_NOT_FOUND)
                            WS-->>C: AppError(NOT_FOUND, WALLET_NOT_FOUND)
                            C-->>U: HTTP 200 {err: 40004, message: WALLET_NOT_FOUND}
                        else Tim thay vi sender
                            PC-->>AT: senderPocket
                            AT->>PC: Find receiver pocket

                            alt Khong tim thay vi receiver
                                PC-->>AT: null
                                AT-->>WS: AppError(NOT_FOUND, WALLET_NOT_FOUND)
                                WS-->>C: AppError(NOT_FOUND, WALLET_NOT_FOUND)
                                C-->>U: HTTP 200 {err: 40004, message: WALLET_NOT_FOUND}
                            else Tim thay vi receiver
                                PC-->>AT: receiverPocket
                                AT->>PC: Debit sender pocket if balance >= amount

                                alt Khong du so du
                                    PC-->>AT: Debit failed
                                    AT-->>WS: AppError(INSUFFICIENT_BALANCE, details)
                                    WS-->>C: AppError(INSUFFICIENT_BALANCE, details)
                                    C-->>U: HTTP 200 {err: 40007, message, availableBalance, requestedAmount}
                                else Tru tien thanh cong
                                    PC-->>AT: updatedSenderPocket
                                    AT->>PC: Credit receiver pocket by amount
                                    PC-->>AT: OK
                                    AT->>TC: Create transaction {sender, receiver, amount, status: SUCCESS}
                                    TC-->>AT: transactionId
                                    MS-->>AT: Commit transaction
                                    AT->>MS: endSession()
                                    AT-->>WS: {transaction, senderPocket}
                                    WS-->>C: {transaction, senderPocket}
                                    C-->>U: HTTP 200 {err: 200, message: OK, transaction, pocket}
                                end
                            end
                        end
                    end
                end
            end
        end
    end
```
## Mapping voi source code

| Thanh phan trong diagram | File trong source code |
| --- | --- |
| `POST /wallet/transfer` | `config/routes.js` |
| `isLoggedIn Policy` | `api/policies/isLoggedIn.js` |
| `Transfer Controller` | `api/controllers/wallet/transfer.js` |
| `Transfer Validator` | `api/validators/transfer.js` |
| `WalletService` | `api/services/WalletService.js` |
| `Atomic Executor` | `api/executors/Atomic.js` |
| `Customer Model` | `api/models/Customer.js` |
| `Pocket Collection` | `api/models/Pocket.js` |
| `Transaction Collection` | `api/models/Transaction.js` |
